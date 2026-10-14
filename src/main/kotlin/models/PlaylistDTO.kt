package com.melodify.models

import kotlinx.serialization.Serializable

@Serializable
data class CreatePlaylistRequest(
    val name: String,
    val description: String = ""
)

@Serializable
data class PlaylistResponse(
    val id: Int,
    val name: String,
    val description: String,
    val totalSongs: Int
)

// Mengubah objek OOP Playlist menjadi respons JSON
fun Playlist.toResponse(): PlaylistResponse {
    return PlaylistResponse(
        id = id,
        name = name,
        description = description,
        totalSongs = totalSongs()
    )
}