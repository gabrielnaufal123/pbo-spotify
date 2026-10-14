
package com.melodify.services


import com.melodify.models.Playlist
import com.melodify.models.Song
import com.melodify.models.AddPlaylistItemRequest
import com.melodify.models.PlaylistItemResponse
import com.melodify.repositories.PlaylistRepository

class PlaylistService(
    private val repository: PlaylistRepository
) {

    // =========================================
    // 1. MEMBUAT PLAYLIST
    // =========================================

    fun createPlaylist(
        name: String,
        description: String
    ): Playlist {

        require(name.isNotBlank()) {
            "Nama playlist tidak boleh kosong"
        }

        require(name.trim().length <= 150) {
            "Nama playlist maksimal 150 karakter"
        }

        return repository.createPlaylist(
            name.trim(),
            description.trim()
        )
    }

    // =========================================
    // 2. MENGAMBIL SEMUA PLAYLIST
    // =========================================

    fun getAllPlaylists(): List<Playlist> {
        return repository.getAllPlaylists()
    }

    // =========================================
    // 3. MENGAMBIL PLAYLIST BERDASARKAN ID
    // =========================================

    fun getPlaylistById(id: Int): Playlist? {
        return repository.getPlaylistById(id)
    }

    // =========================================
    // 4. MENGHAPUS PLAYLIST
    // =========================================

    fun deletePlaylist(id: Int): Boolean {
        return repository.deletePlaylist(id)
    }

    // =========================================
    // 5. MENGAMBIL ISI PLAYLIST
    // =========================================

    fun getPlaylistItems(
        playlistId: Int
    ): List<PlaylistItemResponse> {

        return repository.getPlaylistItems(playlistId)
    }

    // =========================================
    // 6. MENAMBAHKAN LAGU KE PLAYLIST
    // =========================================

    fun addSong(
        playlistId: Int,
        request: AddPlaylistItemRequest
    ): PlaylistItemResponse {

        // Validasi input
        require(request.youtubeVideoId.length == 11) {
            "YouTube Video ID harus 11 karakter"
        }

        require(request.title.isNotBlank()) {
            "Judul lagu tidak boleh kosong"
        }

        require(request.artist.isNotBlank()) {
            "Nama artis tidak boleh kosong"
        }

        require(request.title.length <= 255) {
            "Judul lagu maksimal 255 karakter"
        }

        require(request.artist.length <= 255) {
            "Nama artis maksimal 255 karakter"
        }

        // Memastikan playlist tersedia
        val playlist = repository.getPlaylistById(playlistId)
            ?: throw NoSuchElementException(
                "Playlist tidak ditemukan"
            )

        // Membuat objek Song menggunakan OOP Kotlin
        val song = Song(
            id = request.youtubeVideoId,
            title = request.title.trim(),
            artist = request.artist.trim(),
            youtubeVideoId = request.youtubeVideoId,
            thumbnailUrl = request.thumbnailUrl
        )

        // Memuat lagu yang sudah tersimpan di MySQL
        val existingSongs = repository
            .getPlaylistItems(playlistId)
            .map { item ->

                Song(
                    id = item.youtubeVideoId,
                    title = item.title,
                    artist = item.artist,
                    youtubeVideoId = item.youtubeVideoId,
                    thumbnailUrl = item.thumbnailUrl
                )
            }

        playlist.loadSongs(existingSongs)

        // Menggunakan aturan encapsulation Playlist
        val added = playlist.addSong(song)

        require(added) {
            "Lagu sudah ada di playlist"
        }

        // Menyimpan ke database
        return repository.addSongToPlaylist(
            playlistId,
            song
        )
    }

    // =========================================
    // 7. MENGHAPUS LAGU DARI PLAYLIST
    // =========================================

    fun removeSong(
        playlistId: Int,
        itemId: Int
    ): Boolean {

        return repository.removeSongFromPlaylist(
            playlistId,
            itemId
        )
    }



    fun getAllPlaylistsWithSongs(): List<Playlist> {

        return repository.getAllPlaylists().mapNotNull { playlist ->
            getPlaylistWithSongs(playlist.id)
        }
    }


    // Mengambil satu playlist beserta seluruh lagunya
    fun getPlaylistWithSongs(id: Int): Playlist? {

        val playlist = repository.getPlaylistById(id)
            ?: return null

        val items = repository.getPlaylistItems(id)

        val songs = items.map { item ->
            Song(
                id = item.youtubeVideoId,
                title = item.title,
                artist = item.artist,
                youtubeVideoId = item.youtubeVideoId,
                thumbnailUrl = item.thumbnailUrl
            )
        }

        playlist.loadSongs(songs)

        return playlist
    }


}
