package com.melodify.models

import kotlinx.serialization.Serializable

@Serializable
data class YouTubeVideoDTO(
    val youtubeVideoId: String,
    val title: String,
    val artist: String,
    val thumbnailUrl: String
)