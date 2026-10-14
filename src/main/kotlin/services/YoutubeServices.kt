package com.melodify.services

import com.melodify.models.YouTubeVideoDTO

import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*

import kotlinx.serialization.json.*

class YouTubeService(
    private val apiKey: String,
    private val client: HttpClient = HttpClient(CIO)
) : VideoProvider {

    override suspend fun searchVideos(
        keyword: String
    ): List<YouTubeVideoDTO> {

        if (keyword.isBlank()) {
            return emptyList()
        }

        val response = client.get(
            "https://www.googleapis.com/youtube/v3/search"
        ) {
            parameter("part", "snippet")
            parameter("type", "video")
            parameter("videoEmbeddable", "true")
            parameter("videoSyndicated", "true")
            parameter("maxResults", 10)
            parameter("q", keyword)
            parameter("key", apiKey)
        }

        if (!response.status.isSuccess()) {
            throw IllegalStateException(
                "YouTube API gagal: HTTP ${response.status.value}"
            )
        }

        val json = Json.parseToJsonElement(
            response.bodyAsText()
        ).jsonObject

        val items = json["items"]
            ?.jsonArray
            ?: return emptyList()

        return items.mapNotNull { item ->

            val data = item.jsonObject

            val videoId = data["id"]
                ?.jsonObject
                ?.get("videoId")
                ?.jsonPrimitive
                ?.contentOrNull
                ?: return@mapNotNull null

            val snippet = data["snippet"]
                ?.jsonObject
                ?: return@mapNotNull null

            val title = snippet["title"]
                ?.jsonPrimitive
                ?.contentOrNull
                ?: "Tanpa Judul"

            val artist = snippet["channelTitle"]
                ?.jsonPrimitive
                ?.contentOrNull
                ?: "Unknown Artist"

            val thumbnail = snippet["thumbnails"]
                ?.jsonObject
                ?.get("medium")
                ?.jsonObject
                ?.get("url")
                ?.jsonPrimitive
                ?.contentOrNull
                ?: ""

            YouTubeVideoDTO(
                youtubeVideoId = videoId,
                title = title,
                artist = artist,
                thumbnailUrl = thumbnail
            )
        }
    }
}