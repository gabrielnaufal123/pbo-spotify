
package com.melodify

import com.melodify.database.DatabaseFactory

import com.melodify.repositories.SongRepository
import com.melodify.repositories.PlaylistRepository

import com.melodify.services.PlaylistService
import com.melodify.services.YouTubeService
import com.melodify.services.MusicService

import com.melodify.routes.playlistRoutes
import com.melodify.routes.youtubeRoutes

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

    // =========================================
    // 1. KONFIGURASI JSON
    // =========================================

    install(ContentNegotiation) {
        json()
    }

    // =========================================
    // 2. MEMBUAT REPOSITORY
    // =========================================

    val songRepository = SongRepository()

    val playlistRepository = PlaylistRepository()

    // =========================================
    // 3. MEMBUAT SERVICE PLAYLIST
    // =========================================

    val playlistService = PlaylistService(
        playlistRepository
    )

    // =========================================
    // 4. KONFIGURASI YOUTUBE API
    // =========================================

    val youtubeApiKey = System.getenv("YOUTUBE_API_KEY")
        ?: error("YOUTUBE_API_KEY belum dikonfigurasi")

    val youtubeService = YouTubeService(
        youtubeApiKey
    )

    val musicService = MusicService(
        youtubeService
    )

    // =========================================
    // 5. ROUTING APLIKASI
    // =========================================

    routing {

        // =====================================
        // TEST API
        // =====================================

        get("/api/test") {

            call.respondText(
                "API MELODIFY BERHASIL"
            )
        }

        // =====================================
        // TEST DATABASE MYSQL
        // =====================================

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

        // =====================================
        // API LAGU DARI DATABASE MYSQL
        // =====================================

        get("/api/songs") {

            val songs = withContext(Dispatchers.IO) {
                songRepository.getAllSongs()
            }

            call.respond(songs)
        }

        // =====================================
        // PENCARIAN LAGU DI DATABASE MYSQL
        // =====================================

        get("/api/songs/search") {

            val keyword =
                call.request.queryParameters["q"] ?: ""

            val songs = withContext(Dispatchers.IO) {
                songRepository.searchSongs(keyword)
            }

            call.respond(songs)
        }

        // =====================================
        // API PENCARIAN YOUTUBE
        // =====================================

        youtubeRoutes(musicService)

        // =====================================
        // API PLAYLIST
        // =====================================

        playlistRoutes(playlistService)

        // =====================================
        // FRONTEND HTML, CSS, JAVASCRIPT
        // =====================================

        staticResources("/", "static") {
            default("index.html")
        }

    } // Penutup routing

} // Penutup Application.module()
