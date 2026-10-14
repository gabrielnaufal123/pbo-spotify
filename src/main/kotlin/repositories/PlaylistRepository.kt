package com.melodify.repositories

import com.melodify.database.DatabaseFactory
import com.melodify.models.Playlist
import com.melodify.models.Song
import com.melodify.models.PlaylistItemResponse

import java.sql.Statement

class PlaylistRepository {


    // =========================================
    // READ: mengambil semua lagu dalam playlist
    // =========================================

    fun getPlaylistItems(
        playlistId: Int
    ): List<PlaylistItemResponse> {

        val items = mutableListOf<PlaylistItemResponse>()

        val sql = """
            SELECT
                id,
                playlist_id,
                youtube_video_id,
                title,
                artist,
                thumbnail_url,
                position
            FROM playlist_items
            WHERE playlist_id = ?
            ORDER BY position ASC, id ASC
        """.trimIndent()

        DatabaseFactory.getConnection().use { connection ->

            connection.prepareStatement(sql).use { statement ->

                statement.setInt(1, playlistId)

                statement.executeQuery().use { result ->

                    while (result.next()) {

                        val item = PlaylistItemResponse(
                            id = result.getInt("id"),
                            playlistId = result.getInt("playlist_id"),
                            youtubeVideoId = result.getString("youtube_video_id"),
                            title = result.getString("title"),
                            artist = result.getString("artist") ?: "",
                            thumbnailUrl = result.getString("thumbnail_url") ?: "",
                            position = result.getInt("position")
                        )

                        items.add(item)
                    }
                }
            }
        }

        return items
    }


    // =========================================
    // DELETE: menghapus lagu dari playlist
    // =========================================

    fun removeSongFromPlaylist(
        playlistId: Int,
        itemId: Int
    ): Boolean {

        val sql = """
            DELETE FROM playlist_items
            WHERE playlist_id = ?
            AND id = ?
        """.trimIndent()

        DatabaseFactory.getConnection().use { connection ->

            connection.prepareStatement(sql).use { statement ->

                statement.setInt(1, playlistId)
                statement.setInt(2, itemId)

                val affectedRows = statement.executeUpdate()

                return affectedRows > 0
            }
        }
    }


    fun addSongToPlaylist(
        playlistId: Int,
        song: Song
    ): PlaylistItemResponse {

        DatabaseFactory.getConnection().use { connection ->

            connection.autoCommit = false

            try {
                // Kunci baris playlist agar penambahan item berurutan
                // untuk playlist yang sama tidak saling bertabrakan.
                connection.prepareStatement(
                    "SELECT id FROM playlists WHERE id = ? FOR UPDATE"
                ).use { lock ->
                    lock.setInt(1, playlistId)

                    lock.executeQuery().use { result ->
                        if (!result.next()) {
                            throw NoSuchElementException(
                                "Playlist tidak ditemukan"
                            )
                        }
                    }
                }

                val position = connection.prepareStatement(
                    """
                SELECT COALESCE(MAX(position), 0) + 1
                FROM playlist_items
                WHERE playlist_id = ?
                """.trimIndent()
                ).use { statement ->

                    statement.setInt(1, playlistId)

                    statement.executeQuery().use { result ->
                        result.next()
                        result.getInt(1)
                    }
                }

                val insertSql = """
                INSERT INTO playlist_items
                (playlist_id, youtube_video_id, title, artist,
                 thumbnail_url, position)
                VALUES (?, ?, ?, ?, ?, ?)
            """.trimIndent()

                val itemId = connection.prepareStatement(
                    insertSql,
                    java.sql.Statement.RETURN_GENERATED_KEYS
                ).use { statement ->

                    statement.setInt(1, playlistId)
                    statement.setString(2, song.getVideoId())
                    statement.setString(3, song.title)
                    statement.setString(4, song.artist)
                    statement.setString(5, song.thumbnailUrl)
                    statement.setInt(6, position)

                    statement.executeUpdate()

                    statement.generatedKeys.use { keys ->
                        if (!keys.next()) {
                            error("Gagal mendapatkan ID item")
                        }

                        keys.getInt(1)
                    }
                }

                connection.commit()

                return PlaylistItemResponse(
                    id = itemId,
                    playlistId = playlistId,
                    youtubeVideoId = song.getVideoId(),
                    title = song.title,
                    artist = song.artist,
                    thumbnailUrl = song.thumbnailUrl,
                    position = position
                )

            } catch (e: Exception) {
                connection.rollback()
                throw e
            }
        }
    }

    // CREATE: menyimpan playlist baru
    fun createPlaylist(
        name: String,
        description: String
    ): Playlist {

        val sql = """
            INSERT INTO playlists (name, description)
            VALUES (?, ?)
        """.trimIndent()

        DatabaseFactory.getConnection().use { connection ->

            connection.prepareStatement(
                sql,
                java.sql.Statement.RETURN_GENERATED_KEYS
            ).use { statement ->

                statement.setString(1, name)
                statement.setString(2, description)

                statement.executeUpdate()

                statement.generatedKeys.use { keys ->

                    if (keys.next()) {

                        val id = keys.getInt(1)

                        return Playlist(
                            id = id,
                            name = name,
                            description = description
                        )
                    }
                }
            }
        }

        throw IllegalStateException(
            "Gagal mendapatkan ID playlist baru"
        )
    }

    // READ: mengambil seluruh playlist
    fun getAllPlaylists(): List<Playlist> {

        val playlists = mutableListOf<Playlist>()

        val sql = """
            SELECT id, name, description
            FROM playlists
            ORDER BY id DESC
        """.trimIndent()

        DatabaseFactory.getConnection().use { connection ->

            connection.prepareStatement(sql).use { statement ->

                statement.executeQuery().use { result ->

                    while (result.next()) {

                        playlists.add(
                            Playlist(
                                id = result.getInt("id"),
                                name = result.getString("name"),
                                description =
                                    result.getString("description") ?: ""
                            )
                        )
                    }
                }
            }
        }

        return playlists
    }

    // READ: mencari playlist berdasarkan ID
    fun getPlaylistById(id: Int): Playlist? {

        val sql = """
            SELECT id, name, description
            FROM playlists
            WHERE id = ?
        """.trimIndent()

        DatabaseFactory.getConnection().use { connection ->

            connection.prepareStatement(sql).use { statement ->

                statement.setInt(1, id)

                statement.executeQuery().use { result ->

                    if (result.next()) {

                        return Playlist(
                            id = result.getInt("id"),
                            name = result.getString("name"),
                            description =
                                result.getString("description") ?: ""
                        )
                    }
                }
            }
        }

        return null
    }

    // DELETE: menghapus playlist
    fun deletePlaylist(id: Int): Boolean {

        val sql = """
            DELETE FROM playlists
            WHERE id = ?
        """.trimIndent()

        DatabaseFactory.getConnection().use { connection ->

            connection.prepareStatement(sql).use { statement ->

                statement.setInt(1, id)

                return statement.executeUpdate() > 0
            }
        }
    }
}