package com.melodify.routes

import com.melodify.services.MusicService

import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.youtubeRoutes(
    musicService: MusicService
) {

    route("/api/youtube") {

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