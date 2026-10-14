package com.melodify.models

abstract class Media(
    open val title: String,
    open val artist: String
) {
    abstract fun getInfo(): String
}