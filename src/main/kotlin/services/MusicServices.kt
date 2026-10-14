package com.melodify.services

import com.melodify.models.Song
import com.melodify.models.YouTubeVideoDTO

class MusicService(
    private val videoProvider: VideoProvider
) {
    suspend fun getRecommendations(): List<YouTubeVideoDTO> {

        val keyword = "official music video"

        return searchSongs(keyword)
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