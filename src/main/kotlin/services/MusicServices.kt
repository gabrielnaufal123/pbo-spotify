package com.melodify.services

import com.melodify.models.YouTubeVideoDTO

class MusicService(
    private val videoProvider: VideoProvider
) {

    suspend fun searchSongs(
        keyword: String
    ): List<YouTubeVideoDTO> {

        require(keyword.isNotBlank()) {
            "Kata kunci pencarian tidak boleh kosong"
        }

        require(keyword.length <= 100) {
            "Kata kunci maksimal 100 karakter"
        }

        return videoProvider.searchVideos(
            keyword.trim()
        )
    }
}