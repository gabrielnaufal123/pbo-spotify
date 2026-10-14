package com.melodify.models

import kotlinx.serialization.Serializable

@Serializable
data class SongResponse(
    val id: Int,
    val title: String,
    val artist: String,
    val albumId: Int,
    val albumTitle: String,
    val coverUrl: String?,
    val youtubeVideoId: String,
    val trackNumber: Int,
    val duration: Int
)