
package com.melodify.routes

import com.melodify.models.AddPlaylistItemRequest
import com.melodify.models.CreatePlaylistRequest
import com.melodify.models.toResponse
import com.melodify.services.PlaylistService

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

import java.sql.SQLIntegrityConstraintViolationException

fun Route.playlistRoutes(service: PlaylistService) {

    route("/api/playlists") {

        // ==========================================
        // 1. MENGAMBIL SEMUA PLAYLIST
        // ==========================================

        get {

            val playlists = withContext(Dispatchers.IO) {
                service.getAllPlaylistsWithSongs()
            }

            call.respond(
                playlists.map { it.toResponse() }
            )
        }

        // ==========================================
        // 2. MEMBUAT PLAYLIST BARU
        // ==========================================

        post {

            val request = call.receive<CreatePlaylistRequest>()

            try {

                val playlist = withContext(Dispatchers.IO) {
                    service.createPlaylist(
                        request.name,
                        request.description
                    )
                }

                call.respond(
                    HttpStatusCode.Created,
                    playlist.toResponse()
                )

            } catch (e: IllegalArgumentException) {

                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to (e.message ?: "Input tidak valid"))
                )
            }
        }

        // ==========================================
        // 3. MENGAMBIL DETAIL PLAYLIST
        // ==========================================

        get("/{id}") {

            val id = call.parameters["id"]?.toIntOrNull()

            if (id == null || id <= 0) {

                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "ID playlist tidak valid")
                )

                return@get
            }

            val playlist = withContext(Dispatchers.IO) {
                service.getPlaylistWithSongs(id)
            }

            if (playlist == null) {

                call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "Playlist tidak ditemukan")
                )

                return@get
            }

            call.respond(playlist.toResponse())
        }

        // ==========================================
        // 4. MENGHAPUS PLAYLIST
        // ==========================================

        delete("/{id}") {

            val id = call.parameters["id"]?.toIntOrNull()

            if (id == null || id <= 0) {

                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "ID playlist tidak valid")
                )

                return@delete
            }

            val deleted = withContext(Dispatchers.IO) {
                service.deletePlaylist(id)
            }

            if (deleted) {

                call.respond(HttpStatusCode.NoContent)

            } else {

                call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "Playlist tidak ditemukan")
                )
            }
        }

        // ==========================================
        // 5. MENGAMBIL ISI PLAYLIST
        // ==========================================

        get("/{id}/items") {

            val id = call.parameters["id"]?.toIntOrNull()

            if (id == null || id <= 0) {

                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "ID playlist tidak valid")
                )

                return@get
            }

            val playlist = withContext(Dispatchers.IO) {
                service.getPlaylistById(id)
            }

            if (playlist == null) {

                call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "Playlist tidak ditemukan")
                )

                return@get
            }

            val items = withContext(Dispatchers.IO) {
                service.getPlaylistItems(id)
            }

            call.respond(items)
        }

        // ==========================================
        // 6. MENAMBAHKAN LAGU KE PLAYLIST
        // ==========================================

        post("/{id}/items") {

            val id = call.parameters["id"]?.toIntOrNull()

            if (id == null || id <= 0) {

                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "ID playlist tidak valid")
                )

                return@post
            }

            val request = call.receive<AddPlaylistItemRequest>()

            try {

                val item = withContext(Dispatchers.IO) {
                    service.addSong(id, request)
                }

                call.respond(
                    HttpStatusCode.Created,
                    item
                )

            } catch (e: NoSuchElementException) {

                call.respond(
                    HttpStatusCode.NotFound,
                    mapOf(
                        "error" to (e.message ?: "Playlist tidak ditemukan")
                    )
                )

            } catch (e: IllegalArgumentException) {

                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf(
                        "error" to (e.message ?: "Input tidak valid")
                    )
                )

            } catch (e: SQLIntegrityConstraintViolationException) {

                call.respond(
                    HttpStatusCode.Conflict,
                    mapOf("error" to "Lagu sudah ada di playlist")
                )
            }
        }

        // ==========================================
        // 7. MENGHAPUS LAGU DARI PLAYLIST
        // ==========================================

        delete("/{id}/items/{itemId}") {

            val playlistId =
                call.parameters["id"]?.toIntOrNull()

            val itemId =
                call.parameters["itemId"]?.toIntOrNull()

            if (
                playlistId == null || playlistId <= 0 ||
                itemId == null || itemId <= 0
            ) {

                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "ID tidak valid")
                )

                return@delete
            }

            val deleted = withContext(Dispatchers.IO) {
                service.removeSong(playlistId, itemId)
            }

            if (deleted) {

                call.respond(HttpStatusCode.NoContent)

            } else {

                call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "Lagu tidak ditemukan di playlist")
                )
            }
        }
    }
}
