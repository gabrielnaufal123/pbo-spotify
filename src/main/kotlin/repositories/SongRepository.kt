package com.melodify.repositories

import com.melodify.database.DatabaseFactory
import com.melodify.models.SongResponse

class SongRepository {

    fun getAllSongs(): List<SongResponse> {

        val songs = mutableListOf<SongResponse>()

        val sql = """
            SELECT
                s.id,
                s.title,
                s.artist,
                s.album_id,
                a.title AS album_title,
                a.cover_url,
                s.youtube_video_id,
                s.track_number,
                s.duration
            FROM songs s
            JOIN albums a ON s.album_id = a.id
            ORDER BY s.id
        """.trimIndent()

        DatabaseFactory.getConnection().use { connection ->

            connection.prepareStatement(sql).use { statement ->

                statement.executeQuery().use { result ->

                    while (result.next()) {

                        val song = SongResponse(
                            id = result.getInt("id"),
                            title = result.getString("title"),
                            artist = result.getString("artist"),
                            albumId = result.getInt("album_id"),
                            albumTitle = result.getString("album_title"),
                            coverUrl = result.getString("cover_url"),
                            youtubeVideoId = result.getString("youtube_video_id"),
                            trackNumber = result.getInt("track_number"),
                            duration = result.getInt("duration")
                        )

                        songs.add(song)
                    }
                }
            }
        }

        return songs
    }

    fun searchSongs(keyword: String): List<SongResponse> {

        return getAllSongs().filter { song ->

            song.title.contains(keyword, ignoreCase = true) ||
                    song.artist.contains(keyword, ignoreCase = true) ||
                    song.albumTitle.contains(keyword, ignoreCase = true)
        }
    }
}