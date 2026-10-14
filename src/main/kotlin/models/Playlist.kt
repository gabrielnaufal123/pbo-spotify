package com.melodify.models

class Playlist(
    val id: Int,
    var name: String,
    var description: String = ""
) {

    private val songs = mutableListOf<Song>()

    fun addSong(song: Song): Boolean {

        val alreadyExists = songs.any {
            it.getVideoId() == song.getVideoId()
        }

        if (alreadyExists) return false

        songs.add(song)

        return true
    }

    fun removeSong(videoId: String): Boolean {
        return songs.removeAll {
            it.getVideoId() == videoId
        }
    }

    fun getSongs(): List<Song> {
        return songs.toList()
    }

    fun totalSongs(): Int {
        return songs.size
    }

    // Digunakan saat memuat isi playlist dari MySQL
    fun loadSongs(savedSongs: List<Song>) {
        songs.clear()

        savedSongs.forEach { song ->
            addSong(song)
        }
    }
}