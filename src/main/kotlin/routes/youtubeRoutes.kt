package com.melodify.routes

import com.melodify.services.MusicService

import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.youtubeRoutes(
    musicService: MusicService
) {

    route("/api/youtube") {

        get("/recommendations") {

            // Riwayat putar dikirim browser (disimpan di localStorage)
            val recentArtists = call.request.queryParameters
                .getAll("artist")
                .orEmpty()
                .map { it.trim() }
                .filter { it.isNotEmpty() && it.length <= 100 }
                .take(30)

            val recentVideoIds = call.request.queryParameters
                .getAll("exclude")
                .orEmpty()
                .map { it.trim() }
                .filter { it.isNotEmpty() && it.length <= 20 }
                .take(60)
                .toSet()

            try {

                val recommendations =
                    musicService.getRecommendations(
                        recentArtists,
                        recentVideoIds
                    )

                call.respond(recommendations)

            } catch (e: Exception) {

                environment.log.error(
                    "Gagal mengambil rekomendasi",
                    e
                )

                val quotaExceeded =
                    e.message?.contains("quotaExceeded") == true

                call.respond(
                    HttpStatusCode.BadGateway,
                    mapOf(
                        "error" to if (quotaExceeded) {
                            "Kuota YouTube API hari ini habis. Coba lagi besok."
                        } else {
                            "Gagal mengambil rekomendasi YouTube"
                        }
                    )
                )
            }
        }

        get("/search") {

            val keyword = call.request
                .queryParameters["q"]
                ?.trim()
                ?: ""

            if (keyword.isBlank() || keyword.length > 100) {

                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf(
                        "error" to "Kata kunci harus berisi 1–100 karakter"
                    )
                )

                return@get
            }

            try {

                val results = musicService.searchSongs(
                    keyword
                )

                call.respond(results)

            } catch (e: IllegalArgumentException) {

                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf(
                        "error" to (e.message ?: "Input tidak valid")
                    )
                )

            } catch (e: Exception) {

                environment.log.error(
                    "Gagal mengambil data YouTube",
                    e
                )

                call.respond(
                    HttpStatusCode.BadGateway,
                    mapOf(
                        "error" to "Gagal menghubungi layanan YouTube"
                    )
                )
            }
        }
    }
}