package com.melodify.models

data class Song(
    val id: Int,
    val albumId: Int,
    override val title: String,
    override val artist: String,
    val youtubeVideoId: String,
    val trackNumber: Int
) : Media(title, artist) {

    override fun getInfo(): String {
        return "$title - $artist"
    }

    fun getYoutubeUrl(): String {
        return "https://www.youtube.com/watch?v=$youtubeVideoId"
    }
}