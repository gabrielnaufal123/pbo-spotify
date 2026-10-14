package com.melodify.models

class Song(
    override val id: String,
    override val title: String,
    val artist: String,
    private val youtubeVideoId: String,
    val thumbnailUrl: String = ""
) : Media(id, title), Playable {

    override fun getInfo(): String {
        return "$title - $artist"
    }

    override fun getVideoId(): String {
        return youtubeVideoId
    }

    fun toDTO(): YouTubeVideoDTO {
        return YouTubeVideoDTO(
            youtubeVideoId = getVideoId(),
            title = title,
            artist = artist,
            thumbnailUrl = thumbnailUrl
        )
    }
}