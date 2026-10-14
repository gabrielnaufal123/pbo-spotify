plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(ktorLibs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)
}

val ktorVersion = "3.6.0"
group = "com.example"
version = "1.0.0-SNAPSHOT"

application {
    mainClass = "io.ktor.server.netty.EngineMain"
}

kotlin {
    jvmToolchain(21)
}
dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")

    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")

    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")

    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")

    implementation("com.mysql:mysql-connector-j:8.4.0")
    implementation(ktorLibs.serialization.kotlinx.json)
    implementation(ktorLibs.server.config.yaml)
    implementation(ktorLibs.server.contentNegotiation)
    implementation(ktorLibs.server.core)
    implementation(ktorLibs.server.netty)
    implementation(libs.logback.classic)
    implementation("com.mysql:mysql-connector-j:8.4.0")

    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)
}
