# 🎵 Melodify — Spotify Clone dengan Kotlin

<p align="center">
  <strong>Aplikasi Web Pemutar Musik Berbasis YouTube</strong>
</p>

<p align="center">
  Proyek Kelompok • Pemrograman Berorientasi Objek (PBO)
</p>

Melodify adalah aplikasi web pemutar musik yang terinspirasi dari Spotify. Aplikasi ini dikembangkan menggunakan **Kotlin, Ktor, MySQL, HTML, CSS, dan JavaScript**, dengan integrasi **YouTube Data API v3** melalui Google Cloud untuk pencarian video musik serta **YouTube IFrame Player API** untuk pemutaran video.

Proyek ini bertujuan menerapkan konsep Object-Oriented Programming (OOP) dalam pengembangan aplikasi web, sekaligus mempelajari integrasi REST API, pengelolaan database relasional, pemisahan lapisan aplikasi, dan penggunaan GitHub untuk kolaborasi tim.

> Melodify merupakan proyek pembelajaran yang terinspirasi dari Spotify, bukan aplikasi resmi Spotify. Pemutaran media dilakukan melalui pemutar YouTube dan mengikuti ketentuan layanan YouTube.

---

## 1. Spesifikasi Fungsional dan Keperluan

### Latar Belakang

Aplikasi streaming musik modern menyediakan fitur pencarian lagu, pemutaran musik, pengelolaan playlist, dan rekomendasi berdasarkan preferensi pengguna. Melodify dikembangkan sebagai proyek pembelajaran untuk membangun aplikasi dengan fitur serupa menggunakan Kotlin serta dikombinasikan dengan web.

Melodify memanfaatkan YouTube sebagai sumber metadata dan media yang dapat diputar melalui pemutar resmi YouTube.

### Tujuan Proyek

1. Menerapkan konsep OOP menggunakan Kotlin.
2. Mengintegrasikan YouTube Data API v3 melalui Google Cloud.
3. Menghubungkan backend Kotlin dengan database MySQL.
4. Membangun REST API menggunakan Ktor.
5. Mengembangkan antarmuka web menggunakan HTML, CSS, dan JavaScript.
6. Memahami pengujian aplikasi dan pengelolaan kode menggunakan GitHub.

### Spesifikasi Fungsional

| NO | Fitur | Deskripsi |
|---|---|---|
| 01 | Beranda | Menampilkan rekomendasi musik dan informasi lagu. |
| 02 | Pencarian musik | Mencari video musik berdasarkan kata kunci melalui YouTube Data API v3. |
| 03 | Pemutar musik | Memutar dan menjeda video menggunakan YouTube IFrame Player API. |
| 04 | Koleksi lagu | Mengambil daftar lagu yang tersimpan dalam MySQL. |
| 05 | Pencarian koleksi | Mencari lagu berdasarkan judul atau informasi lagu di database. |
| 06 | Playlist | Membuat, melihat, dan menghapus playlist. |
| 07 | Manajemen playlist | Menambahkan dan menghapus lagu dari playlist. |
| 08 | Rekomendasi | Menampilkan kandidat musik berdasarkan data yang tersedia. |

### Spesifikasi Nonfungsional

- Backend menggunakan Kotlin dan Ktor.
- Database menggunakan MySQL.
- Komunikasi frontend dan backend menggunakan HTTP dan JSON.
- API key disimpan sebagai variabel lingkungan.
- Kode dipisahkan berdasarkan model, repository, service, dan routing.
- Antarmuka dapat diakses melalui browser modern.

---

## 2. Dari Kebutuhan ke Desain: Menemukan Class

Sebelum menulis kode, kebutuhan aplikasi diterjemahkan menjadi objek dan tanggung jawab masing-masing class.

### Rancangan Class

| Class / Interface | Tanggung Jawab |
|---|---|
| `Media` | Model dasar media jika digunakan dalam hierarki model. |
| `Song` | Merepresentasikan lagu dan informasi video YouTube. |
| `Album` | Menyimpan informasi album. |
| `Playlist` | Merepresentasikan playlist dan kumpulan lagu. |
| `Playable` | Mendefinisikan perilaku media yang dapat diputar. |
| `YouTubeService` | Berkomunikasi dengan YouTube Data API v3. |
| `VideoProvider` | Menentukan kontrak pencarian video dan pengambilan musik populer. |
| `MusicService` | Mengelola logika musik. |
| `PlaylistService` | Mengelola logika playlist. |
| `SongRepository` | Mengakses data lagu dalam MySQL. |
| `PlaylistRepository` | Mengakses data playlist dan itemnya. |
| `DatabaseFactory` | Menyiapkan koneksi database. |

### Arsitektur Aplikasi

```text
Pengguna
   |
   v
Frontend HTML, CSS, JavaScript
   |
   v
Ktor REST API / Routing
   |
   +------------------------+
   |                        |
   v                        v
Service Layer          YouTubeService
   |                        |
   v                        v
Repository Layer       YouTube Data API v3
   |
   v
MySQL Database

Frontend Player
   |
   v
YouTube IFrame Player API
   |
   v
Pemutaran Video YouTube
```

Pemisahan ini membantu menjaga agar kode antarmuka, logika bisnis, akses database, dan integrasi eksternal tidak tercampur dalam satu class.

---

## 3. Persiapan Alat

Sebelum menjalankan proyek, pastikan perangkat lunak berikut tersedia.

| Alat | Kegunaan |
|---|---|
| IntelliJ IDEA | IDE untuk mengembangkan Kotlin. |
| JDK 21 | Menjalankan aplikasi Kotlin berbasis JVM. |
| Gradle Wrapper | Mengelola dependency dan proses build. |
| MySQL Server | Menyimpan data lagu dan playlist. |
| MySQL Workbench | Mengelola database secara visual. |
| Google Cloud Console | Mengaktifkan YouTube Data API v3 dan membuat API key. |
| Browser modern | Menjalankan antarmuka web dan pemutar YouTube. |
| Git dan GitHub | Mengelola versi kode dan kolaborasi tim. |
| Docker Desktop | Opsional untuk pengembangan berbasis container. |

### Teknologi yang Digunakan

- **Bahasa backend:** Kotlin
- **Framework backend:** Ktor
- **Frontend:** HTML, CSS, JavaScript
- **Database:** MySQL
- **Integrasi data:** YouTube Data API v3
- **Pemutaran media:** YouTube IFrame Player API
- **HTTP client:** Ktor Client CIO
- **Serialisasi JSON:** kotlinx.serialization
- **Build tool:** Gradle
- **Pengujian:** Kotlin Test dan Ktor Test Host

---

## 4. Langkah 1 — Menyiapkan Proyek

### Struktur Direktori

Struktur utama proyek Melodify dapat disusun sebagai berikut.

```text
pbo-spotify-push/
├── database/
│   └── init.sql
├── src/
│   ├── main/
│   │   ├── kotlin/
│   │   │   ├── database/
│   │   │   ├── interfaces/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── main.kt
│   │   └── resources/
│   │       ├── application.yaml
│   │       └── static/
│   │           ├── index.html
│   │           ├── songs.html
│   │           ├── playlists.html
│   │           ├── playlistdtl.html
│   │           ├── style.css
│   │           └── js/
├── src/test/
├── .env.example
├── .gitignore
├── build.gradle.kts
├── gradlew
├── gradlew.bat
└── README.md
```

*Struktur tersebut merupakan gambaran pengelompokan file. Sesuaikan dengan nama dan lokasi file aktual dalam repository.*

### Menyiapkan Proyek di IntelliJ IDEA

1. Clone repository GitHub atau ekstrak arsip proyek.
2. Buka folder proyek melalui IntelliJ IDEA.
3. Pastikan IDE menggunakan JDK 21.
4. Tunggu Gradle menyelesaikan sinkronisasi dependency.
5. Periksa konfigurasi pada `build.gradle.kts`.
6. Siapkan konfigurasi Google Cloud dan MySQL sebelum menjalankan aplikasi.

Gunakan Gradle Wrapper agar semua anggota tim menggunakan konfigurasi Gradle yang sama.

---

## 5. Langkah 2 — Class Model dan OOP

Model merupakan representasi objek yang digunakan dalam aplikasi. Model membantu menyusun data secara terstruktur dan menjadi dasar penerapan OOP.

Model yang dapat ditemukan atau dikembangkan dalam proyek meliputi:

- `Media.kt`
- `Song.kt`
- `Album.kt`
- `Playlist.kt`
- `PlaylistDTO.kt`
- `PlaylistItemDTO.kt`
- `SongResponse.kt`
- `YoutubeVideoDTO.kt`

### Contoh Model Lagu

```kotlin
data class Song(
    val title: String,
    val artist: String,
    val youtubeVideoId: String,
    val thumbnailUrl: String
)
```

Contoh tersebut merupakan ilustrasi model lagu. Sesuaikan nama properti dengan definisi class yang digunakan dalam proyek.

### Peran Model dalam OOP

1. **Enkapsulasi:** data dan perilaku dikelola melalui class dengan pembatasan akses yang sesuai.
2. **Abstraksi:** detail representasi data dipisahkan dari penggunaannya.
3. **Pewarisan:** class turunan dapat menggunakan struktur class induk apabila hierarki tersebut diterapkan.
4. **Polimorfisme:** objek dengan implementasi berbeda dapat digunakan melalui kontrak yang sama.

Tidak semua model harus menggunakan seluruh pilar OOP. Penerapannya disesuaikan dengan tanggung jawab masing-masing objek.

---

## 6. Langkah 3 — Integrasi YouTube API

Melodify memanfaatkan layanan YouTube untuk mengambil informasi video musik dan menyediakan pemutaran media.

### A. YouTube Data API v3

YouTube Data API v3 digunakan untuk memperoleh metadata video, seperti:

- ID video YouTube.
- Judul video.
- Nama kanal.
- URL thumbnail.
- Hasil pencarian video musik.

Endpoint yang relevan:

| Endpoint | Fungsi |
|---|---|
| `search.list` | Mencari video berdasarkan kata kunci. |
| `videos.list` | Mengambil informasi video, termasuk video populer berdasarkan wilayah. |

Implementasi layanan berada pada lapisan service dan mengikuti kontrak provider yang digunakan proyek.

### B. YouTube IFrame Player API

IFrame Player API digunakan pada frontend untuk memutar video berdasarkan ID video YouTube.

Alur pemutaran:

1. Pengguna memilih lagu.
2. Frontend mendapatkan ID video YouTube.
3. Player memuat video menggunakan YouTube IFrame Player API.
4. Pengguna dapat menjalankan atau menjeda pemutaran melalui kontrol player.

**YouTube Data API v3 tidak menyediakan berkas audio untuk diputar langsung.** API tersebut menyediakan metadata, sedangkan pemutaran dilakukan melalui player YouTube.

### C. Konfigurasi Google Cloud

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat atau pilih project Google Cloud.
3. Buka **APIs & Services → Library**.
4. Cari dan aktifkan **YouTube Data API v3**.
5. Buka **APIs & Services → Credentials**.
6. Buat API key.
7. Simpan API key sebagai variabel lingkungan `YOUTUBE_API_KEY`.

Jangan menuliskan API key asli ke README atau source code yang dipublikasikan.

### D. Konfigurasi Wilayah

Variabel `YOUTUBE_REGION` dapat digunakan untuk menentukan wilayah musik populer. Gunakan kode wilayah yang sesuai, misalnya `ID` untuk Indonesia.

Pencarian dan rekomendasi tetap bergantung pada kuota, ketersediaan video, pembatasan pemutaran, dan respons layanan YouTube.

---

## 7. Langkah 4 — Database MySQL

MySQL digunakan untuk menyimpan koleksi lagu dan data playlist sehingga data dapat digunakan kembali setelah aplikasi dimulai ulang.

### Persiapan Database

1. Jalankan MySQL Server.
2. Buka MySQL Workbench atau klien MySQL lainnya.
3. Buka file `database/init.sql`.
4. Periksa perintah SQL di dalamnya.
5. Jalankan skrip untuk menyiapkan struktur database.
6. Pastikan database dan tabel berhasil dibuat.

Nama database default yang digunakan dalam konfigurasi adalah `melodify`.

### Tabel Utama

| Tabel | Fungsi |
|---|---|
| `albums` | Menyimpan data album dan sampul. |
| `songs` | Menyimpan data lagu dan ID video YouTube. |
| `playlists` | Menyimpan data playlist. |
| `playlist_items` | Menyimpan hubungan antara playlist dan lagu. |

Relasi serta kolom lengkap harus mengikuti definisi aktual dalam `database/init.sql`.

### Konfigurasi Koneksi

| Variabel | Nilai default |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_NAME` | `melodify` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | String kosong jika tidak ditentukan |

Contoh konfigurasi pada Windows PowerShell:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "melodify"
$env:DB_USER = "root"
$env:DB_PASSWORD = "password_mysql_kamu"
```

Ganti nilai password dengan kredensial MySQL lokal.

### Menguji Koneksi Database

Jika endpoint pengujian tersedia, buka:

```text
http://localhost:8080/test-db
```

Periksa respons untuk memastikan aplikasi berhasil terhubung ke MySQL.

---

## 8. Langkah 5 — Repository dan Service

Lapisan repository bertanggung jawab atas akses data, sedangkan lapisan service mengelola logika bisnis.

### Repository

- `SongRepository.kt`: mengakses data lagu dalam MySQL.
- `PlaylistRepository.kt`: membaca dan memodifikasi playlist beserta itemnya.
- `AlbumRepository.kt`: menangani akses data album jika tersedia dalam implementasi.

### Service

- `PlaylistService.kt`: mengelola operasi playlist.
- `MusicServices.kt`: mengelola logika musik atau rekomendasi.
- `YoutubeServices.kt`: menangani komunikasi dengan YouTube Data API v3.

Nama file dan tanggung jawab akhirnya perlu disesuaikan dengan source code aktual.

### Contoh Alur Penambahan Lagu ke Playlist

```text
Pengguna memilih lagu
        |
        v
Frontend mengirim HTTP request
        |
        v
PlaylistRoutes
        |
        v
PlaylistService
        |
        v
PlaylistRepository
        |
        v
MySQL menyimpan item playlist
        |
        v
Respons JSON dikirim ke frontend
```

Pemisahan tersebut mengurangi ketergantungan antara logika bisnis dan detail penyimpanan data.

---

## 9. Langkah 6 — Interface dan Abstraction

Interface digunakan untuk mendefinisikan kontrak perilaku yang harus disediakan oleh class implementasinya.

Contoh kontrak layanan video:

```kotlin
interface VideoProvider {
    suspend fun searchVideos(
        keyword: String,
        musicOnly: Boolean = false,
        maxResults: Int = 10
    ): List<YoutubeVideoDTO>

    suspend fun trendingMusic(
        region: String,
        maxResults: Int = 15
    ): List<YoutubeVideoDTO>
}
```

Contoh tersebut menggambarkan rancangan interface. Nama fungsi dan parameter harus disesuaikan dengan kode yang benar-benar digunakan.

### Mengapa Interface Digunakan?

- Menentukan perilaku yang harus disediakan oleh implementasi.
- Memisahkan kontrak dari detail komunikasi dengan layanan eksternal.
- Memudahkan pengujian menggunakan implementasi pengganti.
- Mendukung polimorfisme.

`YouTubeService` dapat mengimplementasikan kontrak tersebut untuk mengambil data dari YouTube. Interface `Playable` juga dapat digunakan untuk merepresentasikan perilaku media yang dapat diputar.

---

## 10. Langkah 7 — REST API dan Routing

Ktor menangani request HTTP dari frontend dan mengembalikan respons, umumnya dalam format JSON.

### Endpoint Utama

Endpoint berikut merupakan daftar yang perlu dicocokkan dengan definisi routing aktual dalam proyek.

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/test` | Memeriksa endpoint backend. |
| GET | `/test-db` | Menguji koneksi MySQL. |
| GET | `/api/songs` | Mengambil koleksi lagu dari database. |
| GET | `/api/songs/search?q=keyword` | Mencari lagu dalam koleksi database. |
| GET | `/api/youtube/search?q=keyword` | Mencari video musik di YouTube. |
| GET | `/api/youtube/recommendations` | Mengambil rekomendasi musik jika tersedia. |
| GET | `/api/playlists` | Mengambil daftar playlist. |
| POST | `/api/playlists` | Membuat playlist. |
| GET | `/api/playlists/{id}` | Mengambil detail playlist. |
| DELETE | `/api/playlists/{id}` | Menghapus playlist. |
| GET | `/api/playlists/{id}/items` | Mengambil item playlist. |
| POST | `/api/playlists/{id}/items` | Menambahkan lagu ke playlist. |

Endpoint tambahan untuk menghapus item playlist bergantung pada implementasi routing.

### Contoh Pengujian Pencarian YouTube

```text
http://localhost:8080/api/youtube/search?q=lofi
```

Buka URL tersebut setelah server berjalan. Jika konfigurasi benar, endpoint akan mengembalikan hasil pencarian dalam format JSON.

---

## 11. Langkah 8 — Antarmuka Web

Frontend Melodify dikembangkan menggunakan HTML, CSS, dan JavaScript, lalu disajikan oleh Ktor sebagai static resources.

### Halaman Aplikasi

| File | Fungsi |
|---|---|
| `index.html` | Halaman beranda dan rekomendasi. |
| `songs.html` | Halaman koleksi dan pencarian lagu. |
| `playlists.html` | Halaman pengelolaan playlist. |
| `playlistdtl.html` | Halaman detail playlist. |
| `style.css` | Pengaturan tampilan aplikasi. |

### JavaScript Utama

| File | Tanggung Jawab |
|---|---|
| `api.js` | Komunikasi dengan backend API. |
| `player.js` | Integrasi pemutar YouTube. |
| `app.js` | Fungsi umum antarmuka. |
| `router.js` | Navigasi frontend jika digunakan. |
| `home.js` | Logika halaman beranda. |
| `songs.js` | Logika halaman lagu. |
| `playlists.js` | Logika daftar playlist. |
| `playlist-detail.js` | Logika detail playlist. |

Nama file di atas merupakan contoh pengelompokan yang perlu disesuaikan dengan direktori frontend aktual.

### Alur Pemutaran

```text
Pengguna memilih lagu
        |
        v
Frontend mendapatkan YouTube Video ID
        |
        v
YouTube IFrame Player API
        |
        v
Video dimuat dan diputar
```

Tidak semua video YouTube dapat diputar melalui embed. Pemutaran bergantung pada validitas ID video, pengaturan video, dan pembatasan wilayah atau layanan.

---

## 12. Langkah 9 — Menjalankan dan Menguji Manual

### Prasyarat

Pastikan:

- JDK 21 sudah terpasang.
- MySQL Server aktif.
- Database sudah disiapkan.
- Variabel koneksi MySQL sudah benar.
- `YOUTUBE_API_KEY` sudah diisi.
- Gradle berhasil mengunduh dependency.

### Menjalankan di Windows PowerShell

Buka terminal pada direktori root proyek:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "melodify"
$env:DB_USER = "root"
$env:DB_PASSWORD = "password_mysql_kamu"
$env:YOUTUBE_API_KEY = "API_KEY_KAMU"
$env:YOUTUBE_REGION = "ID"

.\gradlew.bat run
```

Ganti nilai password dan API key dengan konfigurasi yang benar. Variabel yang dibuat melalui `$env:` berlaku untuk sesi PowerShell tersebut.

Jika server berhasil berjalan, buka:

```text
http://localhost:8080
```

### Daftar Pengujian Manual

- [ ] Beranda dapat dibuka.
- [ ] Endpoint `/api/test` memberikan respons.
- [ ] Endpoint `/test-db` menunjukkan koneksi database berhasil.
- [ ] Daftar lagu dari MySQL dapat ditampilkan.
- [ ] Pencarian lagu dalam database bekerja.
- [ ] Pencarian video melalui YouTube API berhasil.
- [ ] Video dapat diputar melalui player YouTube.
- [ ] Playlist baru dapat dibuat.
- [ ] Lagu dapat ditambahkan ke playlist.
- [ ] Lagu dapat dihapus dari playlist.
- [ ] Playlist dapat dihapus.
- [ ] Pesan kesalahan ditampilkan ketika terjadi kegagalan request.

---

## 13. Langkah 10 — Unit Testing

Pengujian otomatis membantu memastikan fungsi aplikasi berjalan sesuai harapan.

Proyek Kotlin berbasis Ktor dapat menggunakan Kotlin Test dan Ktor Test Host.

### Menjalankan Test

Pada Windows PowerShell:

```powershell
.\gradlew.bat test
```

Untuk membangun proyek:

```powershell
.\gradlew.bat build
```

### Pengujian yang Disarankan

1. Memastikan endpoint root mengembalikan status HTTP yang sesuai.
2. Memastikan validasi kata kunci pencarian berjalan.
3. Menguji pembuatan playlist dengan nama valid dan tidak valid.
4. Menguji penambahan serta penghapusan item playlist.
5. Menguji pemetaan respons API ke model data.
6. Menguji penanganan kegagalan layanan eksternal.

Pengujian yang membutuhkan database atau YouTube secara langsung perlu menyiapkan dependensi pengujian yang sesuai. Untuk unit test yang stabil, gunakan data pengujian atau implementasi pengganti.

---

## 14. Langkah 11 — Docker (Opsional)

Docker dapat digunakan untuk menyamakan lingkungan pengembangan antaranggota tim.

Penggunaan Docker memerlukan konfigurasi tambahan, seperti `Dockerfile` dan `compose.yaml`, jika file tersebut belum tersedia dalam repository.

### Rencana Pengembangan dengan Docker

1. Membuat `Dockerfile` untuk backend Kotlin.
2. Menyiapkan MySQL sebagai service container.
3. Mengatur konfigurasi melalui environment variables.
4. Menyiapkan persistensi data MySQL.
5. Menjalankan backend dan database melalui Docker Compose.
6. Memastikan API key tidak dimasukkan ke dalam image atau repository.

Bagian ini merupakan rencana pengembangan opsional, bukan klaim bahwa Docker sudah dikonfigurasi dalam proyek.

---

## 15. Langkah 12 — Publikasi ke GitHub

GitHub digunakan untuk menyimpan kode sumber, mencatat perubahan, dan mendukung kolaborasi anggota kelompok.

### Menyiapkan Repository

1. Buat repository baru di GitHub atau gunakan repository tim yang tersedia.
2. Pastikan folder proyek memiliki direktori `.git`.
3. Periksa perubahan dengan `git status`.
4. Tambahkan file yang ingin dipublikasikan.
5. Commit perubahan.
6. Push commit ke branch `main`.

Contoh perintah untuk memperbarui README:

```bash
git status
git add README.md
git commit -m "docs: update Melodify README"
git push origin main
```

Jika ada perubahan source code yang memang ingin dipublikasikan, tambahkan file terkait secara terpisah.

### Keamanan Repository

Pastikan file berikut tidak dipublikasikan:

- `.env` yang berisi API key atau kredensial.
- Password MySQL asli.
- Token akses pribadi.
- Data rahasia lainnya.

Gunakan `.gitignore` untuk mengecualikan file konfigurasi lokal. File `.env.example` dapat digunakan untuk mendokumentasikan nama variabel tanpa menyimpan nilai rahasia.

Jika API key pernah masuk ke commit yang sudah dikirim ke repository publik, menghapus file saja tidak menghilangkan key dari riwayat Git. Lakukan rotasi atau pencabutan key melalui Google Cloud Console.

---

## 16. Ringkasan: Pilar OOP di Melodify

Melodify merupakan proyek pembelajaran OOP yang menggabungkan model domain, interface, service, repository, dan integrasi API.

| Pilar OOP | Penerapan dalam Proyek |
|---|---|
| Enkapsulasi | Mengelola state dan operasi objek melalui class dengan pembatasan akses yang sesuai. |
| Abstraksi | Menggunakan kontrak seperti `VideoProvider` untuk memisahkan perilaku layanan dari implementasinya. |
| Pewarisan | Menggunakan hierarki model apabila class turunan mewarisi class dasar. |
| Polimorfisme | Memungkinkan implementasi berbeda digunakan melalui tipe interface yang sama. |

### Prinsip Desain Pendukung

Selain empat pilar OOP, pemisahan repository dan service mendukung prinsip *separation of concerns*.

- **Model:** merepresentasikan data domain.
- **Repository:** menangani akses data.
- **Service:** mengelola aturan dan logika bisnis.
- **Routes:** menangani komunikasi HTTP.
- **Frontend:** menyajikan antarmuka pengguna.

Penerapan konsep OOP harus dinilai berdasarkan implementasi kode aktual, bukan hanya nama class atau struktur folder.

---

## 17. Latihan Pengembangan

Berikut beberapa ide untuk pengembangan lanjutan.

### Tingkat Dasar

- [ ] Menambahkan validasi input pada pembuatan playlist.
- [ ] Memperbaiki tampilan ketika hasil pencarian kosong.
- [ ] Menambahkan indikator loading saat memuat video.
- [ ] Menambahkan pesan kesalahan ketika YouTube API gagal.

### Tingkat Menengah

- [ ] Menambahkan fitur pengurutan lagu.
- [ ] Menambahkan filter berdasarkan artis atau album.
- [ ] Menambahkan pengujian untuk repository dan service.
- [ ] Memisahkan konfigurasi database dari kode aplikasi.
- [ ] Mengoptimalkan penggunaan kuota YouTube API.

### Tingkat Lanjutan

- [ ] Mengembangkan autentikasi dan akun pengguna.
- [ ] Menghubungkan playlist dengan pengguna tertentu.
- [ ] Menambahkan fitur favorit.
- [ ] Meningkatkan algoritma rekomendasi.
- [ ] Menambahkan Docker Compose untuk backend dan database.
- [ ] Menyiapkan deployment pada server.

Fitur di atas merupakan ide pengembangan dan tidak semuanya tersedia pada implementasi saat ini.

---

## 18. Masalah yang Sering Muncul dan Solusinya

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `YOUTUBE_API_KEY` belum dikonfigurasi | Variabel lingkungan belum tersedia. | Atur `YOUTUBE_API_KEY` sebelum menjalankan server. |
| HTTP 403 dari YouTube API | API key salah, API belum aktif, pembatasan key, atau kuota habis. | Periksa Google Cloud Console, API restrictions, dan penggunaan kuota. |
| Pencarian YouTube gagal | Koneksi internet atau respons API bermasalah. | Periksa log backend dan coba endpoint pencarian kembali. |
| Video tidak dapat diputar | Video tidak mengizinkan embed, ID tidak valid, atau pemutaran dibatasi. | Uji video lain dan periksa implementasi IFrame Player API. |
| MySQL gagal terhubung | Server mati atau konfigurasi salah. | Periksa host, port, nama database, username, dan password. |
| Tabel tidak ditemukan | Skrip database belum dijalankan atau skema tidak sesuai. | Jalankan `database/init.sql` dan verifikasi tabel. |
| Port 8080 sudah digunakan | Ada proses lain yang memakai port tersebut. | Hentikan proses yang menggunakan port atau ubah konfigurasi Ktor. |
| Gradle gagal build | JDK tidak sesuai atau dependency gagal diunduh. | Gunakan JDK yang sesuai dan sinkronkan kembali Gradle. |
| Playlist tidak tersimpan | Request gagal atau terjadi masalah database. | Periksa respons HTTP, log backend, dan isi tabel MySQL. |
| API mengembalikan JSON kosong | Tidak ada data yang cocok atau layanan tidak mengembalikan hasil. | Periksa kata kunci, data database, dan respons API. |
| Test gagal | Konfigurasi pengujian atau asumsi test tidak sesuai. | Baca laporan test dan perbaiki konfigurasi atau implementasinya. |

---

## 📚 Dokumentasi dan Referensi

- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Ktor Documentation](https://ktor.io/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [Google Cloud Console](https://console.cloud.google.com/)
- [GitHub Documentation](https://docs.github.com/)

---

## 👥 Tim Pengembang

Proyek ini dikembangkan sebagai tugas kelompok mata kuliah **Pemrograman Berorientasi Objek (PBO)**.

| Nama | NIM | Username | Tanggung Jawab |
|---|---|---|---|
| **Muhamad Farel Attala** |[@fareu60](https://github.com/fareu60)| **225443013** | Integrasi API |
| **Muhammad Izzudin Irsyad** |[@Syaad26](https://github.com/Syaad26)| **225443018** | OOP / Kotlin |
| **Muhammad Zaidan Habibi** |[@zdnhabibi02-collab](https://github.com/zdnhabibi02-collab)| **225443020** | Frontend / UI, JS |
| **Naufal Rabbani** |[@gabrielnaufal123](https://github.com/gabrielnaufal123)| **225443022** | Setup Ktor, Database, API |
| **Rizal Ahmad Al-Fauzan** | | **225443026** | Dokumentasi |

## 📄 Lisensi dan Penggunaan

Proyek ini dikembangkan untuk tujuan pembelajaran. Nama, merek, logo, dan layanan Spotify maupun YouTube tetap menjadi milik pemilik masing-masing. Melodify tidak berafiliasi dengan atau didukung secara resmi oleh Spotify maupun YouTube.
