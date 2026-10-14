package com.melodify.models

abstract class Media(
    open val id: String,
    open val title: String
) {
    abstract fun getInfo(): String
}