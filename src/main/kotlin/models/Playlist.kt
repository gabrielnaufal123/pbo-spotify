package com.melodify.models

class Playlist(
    val id: Int,
    var name: String,
    var description: String = ""
) {

    // Encapsulation: daftar lagu tidak bisa diubah langsung dari luar class
    private val songs = mutableListOf<Song>()

    // Menambahkan lagu ke playlist
    fun addSong(song: Song): Boolean {

        // Cegah video yang sama masuk dua kali
        if (songs.any {
                it.youtubeVideoId == song.youtubeVideoId
            }) {
            return false
        }

        songs.add(song)
        return true
    }

    // Menghapus lagu berdasarkan YouTube Video ID
    fun removeSong(videoId: String): Boolean {
        return songs.removeAll {
            it.youtubeVideoId == videoId
        }
    }

    // Mengambil daftar lagu tanpa memberikan akses langsung ke MutableList
    fun getSongs(): List<Song> {
        return songs.toList()
    }

    // Menghitung jumlah lagu dalam playlist
    fun totalSongs(): Int {
        return songs.size
    }

    // Mengambil informasi playlist
    fun getInfo(): String {
        return "$name - ${songs.size} lagu"
    }
}