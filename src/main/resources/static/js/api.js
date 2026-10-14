const MelodifyAPI = {

    async request(url, options = {}) {
        const response = await fetch(url, options);

        if (response.status === 204) {
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || `HTTP Error ${response.status}`
            );
        }

        return data;
    },

    // Pencarian dari YouTube melalui Kotlin
    async searchYouTube(keyword) {
        return this.request(
            "/api/youtube/search?q=" +
            encodeURIComponent(keyword)
        );
    },

    // Mengambil semua playlist
    async getPlaylists() {
        return this.request("/api/playlists");
    },

    // Membuat playlist
    async createPlaylist(name, description = "") {
        return this.request("/api/playlists", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, description })
        });
    },

    // Mengambil informasi satu playlist
    async getPlaylist(id) {
        return this.request(`/api/playlists/${id}`);
    },

    // Mengambil isi playlist
    async getPlaylistItems(id) {
        return this.request(`/api/playlists/${id}/items`);
    },

    // Menambahkan lagu YouTube
    async addToPlaylist(id, song) {
        return this.request(`/api/playlists/${id}/items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                youtubeVideoId: song.youtubeVideoId,
                title: song.title,
                artist: song.artist,
                thumbnailUrl: song.thumbnailUrl || ""
            })
        });
    },

    // Menghapus playlist
    async deletePlaylist(id) {
        return this.request(`/api/playlists/${id}`, {
            method: "DELETE"
        });
    },

    // Menghapus satu lagu
    async removePlaylistItem(playlistId, itemId) {
        return this.request(
            `/api/playlists/${playlistId}/items/${itemId}`,
            { method: "DELETE" }
        );
    }
};