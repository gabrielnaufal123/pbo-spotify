package com.melodify.repositories

import com.melodify.database.DatabaseFactory
import com.melodify.models.Playlist

class PlaylistRepository {

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