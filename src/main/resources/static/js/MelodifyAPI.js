
const MelodifyAPI = {

    // Fungsi utama untuk melakukan request ke backend Kotlin
    async request(url, options = {}) {

        const response = await fetch(url, options);

        // DELETE biasanya mengembalikan HTTP 204 tanpa JSON
        if (response.status === 204) {
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Terjadi kesalahan pada server"
            );
        }

        return data;
    },

    // =====================================
    // YOUTUBE
    // =====================================

    async searchYouTube(keyword) {

        return this.request(
            `/api/youtube/search?q=${encodeURIComponent(keyword)}`
        );
    },

    async getRecommendations() {

        return this.request(
            "/api/youtube/recommendations"
        );
    },

    // =====================================
    // PLAYLIST
    // =====================================

    async getPlaylists() {

        return this.request("/api/playlists");
    },

    async createPlaylist(name, description = "") {

        return this.request("/api/playlists", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                description: description
            })
        });
    },

    async getPlaylist(playlistId) {

        return this.request(
            `/api/playlists/${playlistId}`
        );
    },

    async deletePlaylist(playlistId) {

        return this.request(
            `/api/playlists/${playlistId}`,
            {
                method: "DELETE"
            }
        );
    },

    // =====================================
    // PLAYLIST ITEMS
    // =====================================

    async getPlaylistItems(playlistId) {

        return this.request(
            `/api/playlists/${playlistId}/items`
        );
    },

    async addToPlaylist(playlistId, song) {

        return this.request(
            `/api/playlists/${playlistId}/items`,
            {
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
            }
        );
    },

    async removePlaylistItem(playlistId, itemId) {

        return this.request(
            `/api/playlists/${playlistId}/items/${itemId}`,
            {
                method: "DELETE"
            }
        );
    }

};
