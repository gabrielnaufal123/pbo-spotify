package com.melodify.database

import java.sql.Connection
import java.sql.DriverManager

object DatabaseFactory {

    fun getConnection(): Connection {
        return DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/melodify",
            "root",
            ""
        )
    }

    fun testConnection(): Boolean {
        return try {
            getConnection().use { connection ->
                connection.isValid(5)
            }
        } catch (e: Exception) {
            println("ERROR DATABASE: ${e.message}")
            false
        }
    }
}