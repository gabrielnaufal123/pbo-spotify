package com.melodify.services

import com.melodify.models.YouTubeVideoDTO

interface VideoProvider {

    // Mencari video berdasarkan kata kunci.
    // musicOnly = true membatasi hasil ke kategori Music (ID 10).
    suspend fun searchVideos(
        keyword: String,
        musicOnly: Boolean = false,
        maxResults: Int = 10
    ): List<YouTubeVideoDTO>

    // Mengambil tangga lagu musik populer di suatu negara.
    suspend fun trendingMusic(
        region: String,
        maxResults: Int = 15
    ): List<YouTubeVideoDTO>
}
