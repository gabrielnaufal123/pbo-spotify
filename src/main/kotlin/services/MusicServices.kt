package com.melodify.services

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

import com.melodify.models.Song
import com.melodify.models.YouTubeVideoDTO

class MusicService(
    private val videoProvider: VideoProvider
) {
    private val recommendationMutex = Mutex()
    private var recommendationCache:
            List<YouTubeVideoDTO> = emptyList()
    private var lastRecommendationFetch = 0L
    private val cacheDuration = 10 * 60 * 1000L

    suspend fun getRecommendations(): List<YouTubeVideoDTO> {

        return recommendationMutex.withLock {

            val now = System.currentTimeMillis()

            val cacheStillValid =
                recommendationCache.isNotEmpty() &&
                        now - lastRecommendationFetch < cacheDuration

            if (cacheStillValid) {
                return@withLock recommendationCache
            }

            val results = searchSongs("official music video")

            recommendationCache = results
            lastRecommendationFetch = System.currentTimeMillis()

            results
        }
    }

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