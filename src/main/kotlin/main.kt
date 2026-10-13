package com.melodify

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.module() {

    routing {
        get("/") {
            call.respondText("Melodify Server Running!")
        }
    }
}