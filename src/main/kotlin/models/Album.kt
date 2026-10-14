package com.melodify.models

data class Album(
    val id: Int,
    override val title: String,
    override val artist: String,
    val coverUrl: String?
) : Media(title, artist) {

    override fun getInfo(): String {
        return "Album: $title - $artist"
    }

    fun hasCover(): Boolean {
        return !coverUrl.isNullOrBlank()
    }
}