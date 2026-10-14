package com.melodify

import com.melodify.database.DatabaseFactory
import com.melodify.repositories.SongRepository

import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Application.module() {

    install(ContentNegotiation) {
        json()
    }

    val songRepository = SongRepository()

    routing {

        // Menguji koneksi database
        get("/test-db") {

            val connected = withContext(Dispatchers.IO) {
                DatabaseFactory.testConnection()
            }

            if (connected) {
                call.respondText(
                    "Kotlin berhasil terhubung ke MySQL!"
                )
            } else {
                call.respondText(
                    "Koneksi database gagal!",
                    status = HttpStatusCode.InternalServerError
                )
            }
        }

        // Mengambil seluruh lagu
        get("/api/songs") {

            val songs = withContext(Dispatchers.IO) {
                songRepository.getAllSongs()
            }

            call.respond(songs)
        }

        // Mencari lagu
        get("/api/songs/search") {

            val keyword =
                call.request.queryParameters["q"] ?: ""

            val songs = withContext(Dispatchers.IO) {
                songRepository.searchSongs(keyword)
            }

            call.respond(songs)
        }

        // Menampilkan HTML, CSS, dan JavaScript
        staticResources("/", "static") {
            default("index.html")
        }
    }
}