package com.melodify

import com.melodify.database.DatabaseFactory

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Application.module() {

    routing {

        get("/") {
            call.respondText("Server Melodify Berjalan!")
        }

        get("/test-db") {

            val connected = withContext(Dispatchers.IO) {
                DatabaseFactory.testConnection()
            }

            if (connected) {
                call.respondText(
                    "Kotlin berhasil terhubung ke MySQL!"
                )
            } else {
                call.respondText(
                    "Koneksi database gagal!"
                )
            }
        }
    }
}