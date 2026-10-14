package com.melodify.services

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

import com.melodify.models.Song
import com.melodify.models.YouTubeVideoDTO

import java.util.concurrent.ConcurrentHashMap

/**
 * Algoritma rekomendasi: "taste profile" + eksplorasi.
 *
 * 1. Sinyal selera dikumpulkan dari dua sumber:
 *    - artis pada semua lagu di playlist pengguna (MySQL), bobot 2 per lagu
 *    - artis pada riwayat putar terbaru dari browser, bobot 3 yang makin kecil untuk riwayat lama
 * 2. Tiga artis dengan skor tertinggi menjadi "seed".
 * 3. Setiap seed dicari di YouTube (kategori Music), ditambah beberapa lagu dari
 *    tangga lagu populer agar hasil tidak monoton (eksplorasi).
 * 4. Semua daftar digabung selang-seling (round-robin), duplikat dibuang.
 * 5. Lagu yang sudah ada di playlist atau baru diputar dikeluarkan.
 * 6. Jika belum ada sinyal sama sekali (pengguna baru), pakai tangga lagu populer
 *    di negara tertentu. Biayanya hanya 1 unit kuota.
 *
 * Kandidat disimpan 30 menit per kombinasi seed supaya kuota YouTube API hemat
 * (satu search.list = 100 unit dari jatah 10.000 unit per hari).
 */
class MusicService(
    private val videoProvider: VideoProvider,
    private val playlistService: PlaylistService,
    private val region: String = "ID"
) {

    private class SeedArtist(
        val key: String,
        val name: String,
        val score: Double
    )

    private class CachedCandidates(
        val savedAt: Long,
        val items: List<YouTubeVideoDTO>
    )

    private val cacheMutex = Mutex()
    private val cache = ConcurrentHashMap<String, CachedCandidates>()

    private val cacheDuration = 30 * 60 * 1000L
    private val maxCacheEntries = 50
    private val maxSeedArtists = 3
    private val maxRecommendations = 12

    // =========================================
    // REKOMENDASI
    // =========================================

    suspend fun getRecommendations(
        recentArtists: List<String> = emptyList(),
        recentVideoIds: Set<String> = emptySet()
    ): List<YouTubeVideoDTO> {

        val librarySongs = loadLibrarySongs()

        // Lagu yang tidak perlu direkomendasikan lagi
        val alreadyKnown = HashSet<String>(recentVideoIds)
        librarySongs.forEach { alreadyKnown.add(it.getVideoId()) }

        val seeds = pickSeedArtists(
            libraryArtists = librarySongs.map { it.artist },
            recentArtists = recentArtists
        )

        val cacheKey = if (seeds.isEmpty()) {
            "trending:$region"
        } else {
            seeds.joinToString("|") { it.key }
        }

        val candidates = getCandidates(cacheKey, seeds)

        val fresh = candidates.filter {
            it.youtubeVideoId !in alreadyKnown
        }

        // Jika semua kandidat sudah pernah didengar, tampilkan saja kandidatnya
        return (fresh.ifEmpty { candidates }).take(maxRecommendations)
    }

    private suspend fun loadLibrarySongs(): List<Song> {

        return try {

            withContext(Dispatchers.IO) {
                playlistService
                    .getAllPlaylistsWithSongs()
                    .flatMap { it.getSongs() }
            }

        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            // Gangguan database tidak boleh mematikan rekomendasi
            emptyList()
        }
    }

    private fun pickSeedArtists(
        libraryArtists: List<String>,
        recentArtists: List<String>
    ): List<SeedArtist> {

        val scores = LinkedHashMap<String, Pair<String, Double>>()

        fun addScore(rawName: String, weight: Double) {

            val name = cleanArtistName(rawName)

            if (name.length < 2) return

            val key = name.lowercase()
            val previous = scores[key]?.second ?: 0.0

            scores[key] = name to (previous + weight)
        }

        libraryArtists.forEach { addScore(it, 2.0) }

        // Indeks 0 = paling baru, bobotnya paling besar
        recentArtists.forEachIndexed { index, artist ->
            addScore(artist, 3.0 / (1.0 + index * 0.15))
        }

        return scores
            .map { (key, value) ->
                SeedArtist(key, value.first, value.second)
            }
            .sortedByDescending { it.score }
            .take(maxSeedArtists)
    }

    private suspend fun getCandidates(
        cacheKey: String,
        seeds: List<SeedArtist>
    ): List<YouTubeVideoDTO> {

        return cacheMutex.withLock {

            val now = System.currentTimeMillis()

            val cached = cache[cacheKey]

            if (cached != null && now - cached.savedAt < cacheDuration) {
                return@withLock cached.items
            }

            val items = if (seeds.isEmpty()) {
                fetchTrending()
            } else {
                fetchPersonalized(seeds)
            }

            if (items.isNotEmpty()) {

                if (cache.size >= maxCacheEntries) {
                    cache.clear()
                }

                cache[cacheKey] = CachedCandidates(now, items)
            }

            items
        }
    }

    private suspend fun fetchTrending(): List<YouTubeVideoDTO> {

        val trending = attempt {
            videoProvider.trendingMusic(region, 20)
        }

        if (!trending.isNullOrEmpty()) return trending

        // Cadangan bila chart tidak tersedia untuk negara tersebut
        return videoProvider.searchVideos(
            "lagu populer",
            musicOnly = true,
            maxResults = 15
        )
    }

    private suspend fun fetchPersonalized(
        seeds: List<SeedArtist>
    ): List<YouTubeVideoDTO> {

        val lists = mutableListOf<List<YouTubeVideoDTO>>()
        var lastError: Exception? = null

        for (seed in seeds) {

            try {

                lists.add(
                    videoProvider.searchVideos(
                        "${seed.name} official audio",
                        musicOnly = true,
                        maxResults = 8
                    )
                )

            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                lastError = e
            }
        }

        // Eksplorasi: beberapa lagu populer agar rekomendasi tidak monoton
        val explore = attempt {
            videoProvider.trendingMusic(region, 10)
        }.orEmpty().take(3)

        if (explore.isNotEmpty()) {
            lists.add(explore)
        }

        val error = lastError

        if (lists.isEmpty() && error != null) {
            throw error
        }

        return interleave(lists).ifEmpty { fetchTrending() }
    }

    // Menggabungkan beberapa daftar selang-seling tanpa duplikat
    private fun interleave(
        lists: List<List<YouTubeVideoDTO>>
    ): List<YouTubeVideoDTO> {

        val result = ArrayList<YouTubeVideoDTO>()
        val used = HashSet<String>()

        val longest = lists.maxOfOrNull { it.size } ?: 0

        for (position in 0 until longest) {

            for (list in lists) {

                val video = list.getOrNull(position) ?: continue

                if (used.add(video.youtubeVideoId)) {
                    result.add(video)
                }
            }
        }

        return result
    }

    private suspend fun <T> attempt(block: suspend () -> T): T? {

        return try {
            block()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            null
        }
    }

    // "Blue - Topic" -> "Blue", "BlackpinkVEVO" -> "Blackpink"
    internal fun cleanArtistName(raw: String): String {

        var name = raw.trim()

        repeat(2) {
            name = artistNoise.replace(name, "").trim()
        }

        return name
    }

    private val artistNoise = Regex(
        "\\s*(-\\s*topic|vevo|official( channel)?)\\s*$",
        RegexOption.IGNORE_CASE
    )

    // =========================================
    // PENCARIAN
    // =========================================

    suspend fun searchSongs(
        keyword: String
    ): List<YouTubeVideoDTO> {

        require(keyword.isNotBlank()) {
            "Kata kunci tidak boleh kosong"
        }

        require(keyword.length <= 100) {
            "Kata kunci maksimal 100 karakter"
        }

        // Mengambil data dari penyedia video
        val results = videoProvider.searchVideos(keyword.trim())

        // Membentuk objek Song menggunakan OOP
        val songs: List<Song> = results.map { video ->

            Song(
                id = video.youtubeVideoId,
                title = video.title,
                artist = video.artist,
                youtubeVideoId = video.youtubeVideoId,
                thumbnailUrl = video.thumbnailUrl
            )
        }

        // Mengubah objek Song menjadi DTO untuk frontend
        return songs.map { it.toDTO() }
    }
}
