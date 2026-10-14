package com.melodify.models

import kotlinx.serialization.Serializable

@Serializable
data class AddPlaylistItemRequest(
    val youtubeVideoId: String,
    val title: String,
    val artist: String,
    val thumbnailUrl: String = ""
)

@Serializable
data class PlaylistItemResponse(
    val id: Int,
    val playlistId: Int,
    val youtubeVideoId: String,
    val title: String,
    val artist: String,
    val thumbnailUrl: String,
    val position: Int
)