package com.melodify.database

import java.sql.Connection
import java.sql.DriverManager

object DatabaseFactory {

    private val host =
        System.getenv("DB_HOST") ?: "localhost"

    private val port =
        System.getenv("DB_PORT") ?: "3306"

    private val database =
        System.getenv("DB_NAME") ?: "melodify"

    private val username =
        System.getenv("DB_USER") ?: "root"

    private val password =
        System.getenv("DB_PASSWORD") ?: ""

    private val url =
        "jdbc:mysql://$host:$port/$database" +
                "?useSSL=false&serverTimezone=Asia/Jakarta"

    fun getConnection(): Connection {

        return DriverManager.getConnection(
            url,
            username,
            password
        )
    }

    fun testConnection(): Boolean {

        return try {

            getConnection().use { connection ->
                connection.isValid(3)
            }

        } catch (e: Exception) {

            false
        }
    }

}