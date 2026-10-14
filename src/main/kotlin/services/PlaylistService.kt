package com.melodify.services

import com.melodify.models.Playlist
import com.melodify.repositories.PlaylistRepository

class PlaylistService(
    private val repository: PlaylistRepository
) {

    fun createPlaylist(
        name: String,
        description: String
    ): Playlist {

        // Validasi menggunakan Kotlin
        require(name.isNotBlank()) {
            "Nama playlist tidak boleh kosong"
        }

        require(name.length <= 150) {
            "Nama playlist maksimal 150 karakter"
        }

        return repository.createPlaylist(
            name.trim(),
            description.trim()
        )
    }

    fun getAllPlaylists(): List<Playlist> {
        return repository.getAllPlaylists()
    }

    fun getPlaylistById(id: Int): Playlist? {
        return repository.getPlaylistById(id)
    }

    fun deletePlaylist(id: Int): Boolean {
        return repository.deletePlaylist(id)
    }
}