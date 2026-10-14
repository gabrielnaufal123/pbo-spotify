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

    // search.list: biaya kuota 100 unit per panggilan
    override suspend fun searchVideos(
        keyword: String,
        musicOnly: Boolean,
        maxResults: Int
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
            parameter("maxResults", maxResults.coerceIn(1, 25))
            parameter("q", keyword)
            if (musicOnly) {
                parameter("videoCategoryId", "10")
            }
            parameter("key", apiKey)
        }

        val json = parseOrThrow(response)

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

            toVideoDTO(videoId, snippet)
        }
    }

    // videos.list (chart=mostPopular): biaya kuota hanya 1 unit
    override suspend fun trendingMusic(
        region: String,
        maxResults: Int
    ): List<YouTubeVideoDTO> {

        val response = client.get(
            "https://www.googleapis.com/youtube/v3/videos"
        ) {
            parameter("part", "snippet,status")
            parameter("chart", "mostPopular")
            parameter("videoCategoryId", "10")
            parameter("regionCode", region)
            parameter("maxResults", maxResults.coerceIn(1, 50))
            parameter("key", apiKey)
        }

        val json = parseOrThrow(response)

        val items = json["items"]
            ?.jsonArray
            ?: return emptyList()

        return items.mapNotNull { item ->

            val data = item.jsonObject

            val videoId = data["id"]
                ?.jsonPrimitive
                ?.contentOrNull
                ?: return@mapNotNull null

            val snippet = data["snippet"]
                ?.jsonObject
                ?: return@mapNotNull null

            // Lewati video yang tidak boleh diputar lewat iframe
            val embeddable = data["status"]
                ?.jsonObject
                ?.get("embeddable")
                ?.jsonPrimitive
                ?.booleanOrNull
                ?: true

            if (!embeddable) return@mapNotNull null

            toVideoDTO(videoId, snippet)
        }
    }

    private suspend fun parseOrThrow(
        response: HttpResponse
    ): JsonObject {

        val body = response.bodyAsText()

        if (!response.status.isSuccess()) {
            // Sertakan alasan dari Google (mis. quotaExceeded) agar mudah dilacak di log
            throw IllegalStateException(
                "YouTube API gagal: HTTP ${response.status.value} ${body.take(300)}"
            )
        }

        return Json.parseToJsonElement(body).jsonObject
    }

    private fun toVideoDTO(
        videoId: String,
        snippet: JsonObject
    ): YouTubeVideoDTO {

        val title = snippet["title"]
            ?.jsonPrimitive
            ?.contentOrNull
            ?.let { decodeHtmlEntities(it) }
            ?: "Tanpa Judul"

        val artist = snippet["channelTitle"]
            ?.jsonPrimitive
            ?.contentOrNull
            ?.let { decodeHtmlEntities(it) }
            ?: "Unknown Artist"

        val thumbnails = snippet["thumbnails"]?.jsonObject

        val thumbnail = (
                thumbnails?.get("medium")
                    ?: thumbnails?.get("high")
                    ?: thumbnails?.get("default")
                )
            ?.jsonObject
            ?.get("url")
            ?.jsonPrimitive
            ?.contentOrNull
            ?: ""

        return YouTubeVideoDTO(
            youtubeVideoId = videoId,
            title = title,
            artist = artist,
            thumbnailUrl = thumbnail
        )
    }
}

private val numericEntity = Regex("&#(x?)([0-9a-fA-F]+);")

// YouTube mengirim judul dalam bentuk HTML-escaped, mis. "Rock &amp; Roll" atau "Don&#39;t".
// Fungsi ini mengembalikannya ke teks biasa sebelum dikirim ke frontend.
internal fun decodeHtmlEntities(text: String): String {

    if (!text.contains('&')) return text

    val withNumeric = numericEntity.replace(text) { match ->

        val radix = if (match.groupValues[1].isEmpty()) 10 else 16
        val code = match.groupValues[2].toIntOrNull(radix)

        if (code != null && code in 1..0x10FFFF) {
            String(Character.toChars(code))
        } else {
            match.value
        }
    }

    // &amp; diproses paling akhir agar "&amp;lt;" tidak terdekode dua kali
    return withNumeric
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&amp;", "&")
}
