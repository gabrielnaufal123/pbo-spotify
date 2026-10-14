package com.melodify.services

import com.melodify.models.YouTubeVideoDTO

interface VideoProvider {

    suspend fun searchVideos(
        keyword: String
    ): List<YouTubeVideoDTO>
}