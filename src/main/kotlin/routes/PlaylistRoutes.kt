package com.melodify.routes

import com.melodify.models.CreatePlaylistRequest
import com.melodify.models.toResponse
import com.melodify.services.PlaylistService

import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.playlistRoutes(
    service: PlaylistService
) {

    route("/api/playlists") {

        // GET: mengambil semua playlist
        get {

            val playlists = withContext(Dispatchers.IO) {
                service.getAllPlaylists()
            }

            call.respond(
                playlists.map { it.toResponse() }
            )
        }

        // POST: membuat playlist baru
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
                    mapOf(
                        "error" to (e.message ?: "Input tidak valid")
                    )
                )
            }
        }

        // GET: mengambil playlist berdasarkan ID
        get("/{id}") {

            val id = call.parameters["id"]?.toIntOrNull()

            if (id == null) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "ID tidak valid")
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

            } else {

                call.respond(playlist.toResponse())
            }
        }

        // DELETE: menghapus playlist
        delete("/{id}") {

            val id = call.parameters["id"]?.toIntOrNull()

            if (id == null) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "ID tidak valid")
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
    }
}