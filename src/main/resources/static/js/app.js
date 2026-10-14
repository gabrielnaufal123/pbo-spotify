
/*
 * ============================================
 * MELODIFY - APP.JS
 * ============================================
 *
 * File ini menghubungkan:
 * - HTML
 * - api.js
 * - player.js
 * - Backend Kotlin Ktor
 *
 * Urutan script pada HTML:
 * 1. YouTube IFrame API
 * 2. api.js
 * 3. player.js
 * 4. app.js
 */

const MelodifyApp = {

    // =========================================
    // STATE APLIKASI
    // =========================================

    searchResults: [],
    recommendations: [],
    playlists: [],
    playlistItems: [],

    selectedSong: null,
    currentPlaylistId: null,

    // =========================================
    // INITIALIZATION
    // =========================================

    async init() {

        console.log("Melodify App initialized");

        this.bindEvents();
        this.bindPlayerEvents();

        // Memuat playlist untuk sidebar / halaman playlist
        await this.loadPlaylists();

        // Menentukan halaman berdasarkan elemen HTML
        if (document.getElementById("recommendations")) {
            await this.loadRecommendations();
        }

        if (document.getElementById("playlist-list")) {
            this.renderPlaylists();
        }

        // Halaman detail playlist
        const params = new URLSearchParams(window.location.search);

        const playlistId = params.get("id");

        if (
            playlistId &&
            document.getElementById("playlist-items")
        ) {
            await this.loadPlaylistDetail(Number(playlistId));
        }
    },

    // =========================================
    // EVENT LISTENERS
    // =========================================

    bindEvents() {

        // FORM PENCARIAN

        // =========================================
        // FORM PENCARIAN YOUTUBE
        // =========================================

        const searchForm = document.getElementById("search-form");
        const searchInput = document.getElementById("search-input");

        if (searchForm && searchInput) {

            searchForm.addEventListener("submit", async (event) => {

                event.preventDefault();

                const keyword = searchInput.value.trim();

                console.log("Mencari lagu:", keyword);

                if (!keyword) {
                    this.showMessage(
                        "Masukkan judul lagu atau nama artis terlebih dahulu."
                    );
                    return;
                }

                await this.searchSongs(keyword);
            });

        } else {
            console.warn(
                "Form pencarian tidak ditemukan. Periksa ID pada songs.html."
            );
        }


        // FORM MEMBUAT PLAYLIST
        const createPlaylistForm = document.getElementById(
            "create-playlist-form"
        );

        if (createPlaylistForm) {

            createPlaylistForm.addEventListener(
                "submit",
                async (event) => {

                    event.preventDefault();

                    const name = document.getElementById(
                        "playlist-name"
                    )?.value.trim();

                    const description = document.getElementById(
                        "playlist-description"
                    )?.value.trim() || "";

                    if (!name) {
                        this.showMessage("Nama playlist tidak boleh kosong.");
                        return;
                    }

                    await this.createPlaylist(name, description);

                    createPlaylistForm.reset();
                }
            );
        }

        // TOMBOL PLAYER
        document.getElementById("player-play-btn")
            ?.addEventListener("click", () => {
                MelodifyPlayer.togglePlay();
            });

        document.getElementById("player-next-btn")
            ?.addEventListener("click", () => {
                MelodifyPlayer.next();
            });

        document.getElementById("player-prev-btn")
            ?.addEventListener("click", () => {
                MelodifyPlayer.previous();
            });

        // VOLUME
        document.getElementById("player-volume")
            ?.addEventListener("input", (event) => {
                MelodifyPlayer.setVolume(event.target.value);
            });

        // PROGRESS
        document.getElementById("player-progress")
            ?.addEventListener("input", (event) => {
                MelodifyPlayer.seekTo(event.target.value);
            });
    },

    // =========================================
    // PLAYER EVENTS
    // =========================================

    bindPlayerEvents() {

        window.addEventListener(
            "melodify:song-change",
            (event) => {

                const song = event.detail.song;

                console.log("Lagu diputar:", song.title);

                this.selectedSong = song;
            }
        );

        window.addEventListener(
            "melodify:player-error",
            () => {

                this.showMessage(
                    "Video tidak dapat diputar. Coba lagu lainnya."
                );
            }
        );
    },

    // =========================================
    // SEARCH YOUTUBE
    // =========================================


    // =========================================
    // SEARCH YOUTUBE
    // =========================================

    async searchSongs(keyword) {

        const container = document.getElementById("search-results");
        const songCount = document.getElementById("song-count");

        if (!container) {
            console.error("Elemen #search-results tidak ditemukan.");
            return;
        }

        container.textContent = "Sedang mencari lagu...";

        if (songCount) {
            songCount.textContent = "Mencari lagu...";
        }

        try {

            const songs = await MelodifyAPI.searchYouTube(keyword);

            this.searchResults = Array.isArray(songs) ? songs : [];

            this.renderSongs(
                this.searchResults,
                "search-results"
            );

            if (songCount) {
                songCount.textContent =
                    `${this.searchResults.length} hasil pencarian ditemukan`;
            }

        } catch (error) {

            console.error("Search error:", error);

            container.textContent = "";

            if (songCount) {
                songCount.textContent = "Pencarian gagal";
            }

            this.showMessage(
                "Gagal mencari lagu: " + error.message
            );
        }
    },

    // =========================================
    // RECOMMENDATIONS
    // =========================================

    async loadRecommendations() {

        const container = document.getElementById("recommendations");

        if (!container) return;

        container.innerHTML = "<p>Memuat rekomendasi...</p>";

        try {

            const songs = await MelodifyAPI.getRecommendations();

            this.recommendations = Array.isArray(songs) ? songs : [];

            this.renderSongs(
                this.recommendations,
                "recommendations"
            );

        } catch (error) {

            console.error("Recommendation error:", error);

            container.textContent =
                "Rekomendasi belum tersedia.";
        }
    },

    // =========================================
    // RENDER SONGS
    // =========================================

    renderSongs(songs, containerId) {

        const container = document.getElementById(containerId);

        if (!container) return;

        container.innerHTML = "";

        if (!songs || songs.length === 0) {

            container.innerHTML = "<p>Tidak ada lagu ditemukan.</p>";

            return;
        }

        songs.forEach((song, index) => {

            const card = document.createElement("div");

            card.className = "song-card";

            const thumbnail = document.createElement("img");

            thumbnail.src = song.thumbnailUrl ||
                `https://img.youtube.com/vi/${song.youtubeVideoId}/mqdefault.jpg`;

            thumbnail.alt = song.title;

            thumbnail.loading = "lazy";

            const info = document.createElement("div");

            info.className = "song-info";

            const title = document.createElement("h3");
            title.textContent = song.title;

            const artist = document.createElement("p");
            artist.textContent = song.artist;

            info.appendChild(title);
            info.appendChild(artist);

            const actions = document.createElement("div");

            actions.className = "song-actions";

            // TOMBOL PLAY
            const playButton = document.createElement("button");

            playButton.type = "button";
            playButton.textContent = "▶ Play";

            playButton.addEventListener("click", () => {

                // Memutar seluruh hasil pencarian sebagai antrean
                MelodifyPlayer.setQueue(songs, index);

            });

            // TOMBOL TAMBAH KE PLAYLIST
            const addButton = document.createElement("button");

            addButton.type = "button";
            addButton.textContent = "+ Playlist";

            addButton.addEventListener("click", async () => {

                this.selectedSong = song;

                await this.choosePlaylist(song);
            });

            actions.appendChild(playButton);
            actions.appendChild(addButton);

            card.appendChild(thumbnail);
            card.appendChild(info);
            card.appendChild(actions);

            container.appendChild(card);
        });
    },

    // =========================================
    // LOAD PLAYLISTS
    // =========================================

    async loadPlaylists() {

        try {

            const data = await MelodifyAPI.getPlaylists();

            this.playlists = Array.isArray(data) ? data : [];

            this.renderPlaylists();

        } catch (error) {

            console.error("Load playlists error:", error);

            this.showMessage(
                "Gagal mengambil playlist: " + error.message
            );
        }
    },

    // =========================================
    // RENDER PLAYLISTS
    // =========================================

    renderPlaylists() {

        const container = document.getElementById("playlist-list");

        if (!container) return;

        container.innerHTML = "";

        if (this.playlists.length === 0) {

            container.innerHTML =
                "<p>Belum ada playlist. Buat playlist pertamamu!</p>";

            return;
        }

        this.playlists.forEach((playlist) => {

            const card = document.createElement("div");

            card.className = "playlist-card";

            const info = document.createElement("div");

            info.className = "playlist-info";

            const title = document.createElement("h3");

            title.textContent = playlist.name;

            const description = document.createElement("p");

            description.textContent =
                playlist.description || "Tidak ada deskripsi";

            const totalSongs = document.createElement("small");

            totalSongs.textContent =
                `${playlist.totalSongs || 0} lagu`;

            info.appendChild(title);
            info.appendChild(description);
            info.appendChild(totalSongs);

            const actions = document.createElement("div");

            actions.className = "playlist-actions";

            // BUKA PLAYLIST
            const openButton = document.createElement("button");

            openButton.type = "button";
            openButton.textContent = "Buka";

            openButton.addEventListener("click", () => {

                window.location.href =
                    `/playlistdtl.html?id=${playlist.id}`;
            });

            // HAPUS PLAYLIST
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.textContent = "Hapus";

            deleteButton.addEventListener("click", async () => {

                await this.deletePlaylist(playlist.id);
            });

            actions.appendChild(openButton);
            actions.appendChild(deleteButton);

            card.appendChild(info);
            card.appendChild(actions);

            container.appendChild(card);
        });
    },

    // =========================================
    // CREATE PLAYLIST
    // =========================================

    async createPlaylist(name, description = "") {

        try {

            const playlist = await MelodifyAPI.createPlaylist(
                name,
                description
            );

            this.showMessage(
                `Playlist "${playlist.name}" berhasil dibuat!`
            );

            await this.loadPlaylists();

            return playlist;

        } catch (error) {

            console.error("Create playlist error:", error);

            this.showMessage(
                "Gagal membuat playlist: " + error.message
            );

            return null;
        }
    },

    // =========================================
    // DELETE PLAYLIST
    // =========================================

    async deletePlaylist(playlistId) {

        const confirmed = confirm(
            "Yakin ingin menghapus playlist ini?"
        );

        if (!confirmed) return;

        try {

            await MelodifyAPI.deletePlaylist(playlistId);

            this.showMessage("Playlist berhasil dihapus.");

            await this.loadPlaylists();

        } catch (error) {

            console.error("Delete playlist error:", error);

            this.showMessage(
                "Gagal menghapus playlist: " + error.message
            );
        }
    },

    // =========================================
    // CHOOSE PLAYLIST
    // =========================================

    async choosePlaylist(song) {

        // Memastikan data playlist terbaru
        try {

            const data = await MelodifyAPI.getPlaylists();

            this.playlists = Array.isArray(data) ? data : [];

        } catch (error) {

            this.showMessage(
                "Gagal mengambil playlist: " + error.message
            );

            return;
        }

        if (this.playlists.length === 0) {

            this.showMessage(
                "Kamu belum mempunyai playlist. Buat playlist dahulu."
            );

            return;
        }

        // Menampilkan daftar playlist yang dapat dipilih
        const options = this.playlists
            .map(playlist => {
                return `${playlist.id}. ${playlist.name}`;
            })
            .join("\n");

        const answer = prompt(
            "Pilih ID playlist untuk menambahkan lagu:\n\n" +
            options
        );

        if (answer === null) return;

        const playlistId = Number(answer.trim());

        const selectedPlaylist = this.playlists.find(
            playlist => playlist.id === playlistId
        );

        if (!selectedPlaylist) {

            this.showMessage("ID playlist tidak valid.");

            return;
        }

        await this.addSongToPlaylist(
            playlistId,
            song
        );
    },

    // =========================================
    // ADD SONG TO PLAYLIST
    // =========================================

    async addSongToPlaylist(playlistId, song) {

        try {

            await MelodifyAPI.addToPlaylist(
                playlistId,
                song
            );

            this.showMessage(
                `"${song.title}" berhasil ditambahkan ke playlist!`
            );

            await this.loadPlaylists();

            // Refresh halaman detail jika playlist yang sama terbuka
            if (this.currentPlaylistId === playlistId) {

                await this.loadPlaylistDetail(playlistId);
            }

        } catch (error) {

            console.error("Add song error:", error);

            this.showMessage(
                "Gagal menambahkan lagu: " + error.message
            );
        }
    },

    // =========================================
    // LOAD PLAYLIST DETAIL
    // =========================================

    async loadPlaylistDetail(playlistId) {

        if (!Number.isInteger(playlistId) || playlistId <= 0) {

            this.showMessage("ID playlist tidak valid.");

            return;
        }

        this.currentPlaylistId = playlistId;

        const container = document.getElementById("playlist-items");

        if (container) {
            container.innerHTML = "<p>Memuat isi playlist...</p>";
        }

        try {

            // Mengambil informasi playlist
            const playlist = await MelodifyAPI.getPlaylist(
                playlistId
            );

            // Mengambil daftar lagu playlist
            const items = await MelodifyAPI.getPlaylistItems(
                playlistId
            );

            this.playlistItems = Array.isArray(items) ? items : [];

            // Menampilkan judul dan deskripsi playlist
            const title = document.getElementById(
                "playlist-detail-title"
            );

            const description = document.getElementById(
                "playlist-detail-description"
            );

            if (title) {
                title.textContent = playlist.name;
            }

            if (description) {
                description.textContent =
                    playlist.description || "";
            }

            this.renderPlaylistItems();

        } catch (error) {

            console.error("Playlist detail error:", error);

            if (container) {
                container.innerHTML = "";
            }

            this.showMessage(
                "Gagal mengambil detail playlist: " + error.message
            );
        }
    },

    // =========================================
    // RENDER PLAYLIST ITEMS
    // =========================================

    renderPlaylistItems() {

        const container = document.getElementById(
            "playlist-items"
        );

        if (!container) return;

        container.innerHTML = "";

        if (this.playlistItems.length === 0) {

            container.innerHTML =
                "<p>Playlist ini belum memiliki lagu.</p>";

            return;
        }

        // Mengubah PlaylistItemResponse menjadi data Song
        const songs = this.playlistItems.map(item => ({

            youtubeVideoId: item.youtubeVideoId,
            title: item.title,
            artist: item.artist,
            thumbnailUrl: item.thumbnailUrl

        }));

        this.playlistItems.forEach((item, index) => {

            const card = document.createElement("div");

            card.className = "song-card";

            const thumbnail = document.createElement("img");

            thumbnail.src = item.thumbnailUrl ||
                `https://img.youtube.com/vi/${item.youtubeVideoId}/mqdefault.jpg`;

            thumbnail.alt = item.title;

            thumbnail.loading = "lazy";

            const info = document.createElement("div");

            info.className = "song-info";

            const title = document.createElement("h3");

            title.textContent = item.title;

            const artist = document.createElement("p");

            artist.textContent = item.artist;

            info.appendChild(title);
            info.appendChild(artist);

            const actions = document.createElement("div");

            actions.className = "song-actions";

            // PLAY
            const playButton = document.createElement("button");

            playButton.type = "button";
            playButton.textContent = "▶ Play";

            playButton.addEventListener("click", () => {

                MelodifyPlayer.setQueue(songs, index);

            });

            // REMOVE
            const removeButton = document.createElement("button");

            removeButton.type = "button";
            removeButton.textContent = "Hapus";

            removeButton.addEventListener("click", async () => {

                await this.removeSongFromPlaylist(
                    this.currentPlaylistId,
                    item.id
                );
            });

            actions.appendChild(playButton);
            actions.appendChild(removeButton);

            card.appendChild(thumbnail);
            card.appendChild(info);
            card.appendChild(actions);

            container.appendChild(card);
        });
    },

    // =========================================
    // REMOVE SONG FROM PLAYLIST
    // =========================================

    async removeSongFromPlaylist(playlistId, itemId) {

        const confirmed = confirm(
            "Yakin ingin menghapus lagu ini dari playlist?"
        );

        if (!confirmed) return;

        try {

            await MelodifyAPI.removePlaylistItem(
                playlistId,
                itemId
            );

            this.showMessage("Lagu berhasil dihapus dari playlist.");

            await this.loadPlaylistDetail(playlistId);

            await this.loadPlaylists();

        } catch (error) {

            console.error("Remove song error:", error);

            this.showMessage(
                "Gagal menghapus lagu: " + error.message
            );
        }
    },

    // =========================================
    // MESSAGE
    // =========================================

    showMessage(message) {

        const messageBox = document.getElementById("app-message");

        if (messageBox) {

            messageBox.textContent = message;

            messageBox.style.display = "block";

            return;
        }

        // Jika HTML belum menyediakan #app-message
        alert(message);
    }
};

// =========================================
// START APPLICATION
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    MelodifyApp.init().catch(error => {

        console.error("Melodify initialization error:", error);

    });

});
