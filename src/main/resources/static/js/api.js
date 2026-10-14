/*
 * MELODIFY - API.JS
 * Satu-satunya pintu komunikasi frontend dengan backend Kotlin.
 */

const MelodifyAPI = {

    async request(url, options = {}) {

        const response = await fetch(url, options);

        // DELETE mengembalikan HTTP 204 tanpa body
        if (response.status === 204) {
            return null;
        }

        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            // body kosong atau bukan JSON
        }

        if (!response.ok) {
            throw new Error(
                (data && data.error) ||
                `Server bermasalah (HTTP ${response.status})`
            );
        }

        return data;
    },

    json(method, body) {
        return {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        };
    },

    // =====================================
    // YOUTUBE
    // =====================================

    searchYouTube(keyword) {
        return this.request(
            "/api/youtube/search?q=" + encodeURIComponent(keyword)
        );
    },

    // artists = artis dari riwayat putar (terbaru dulu)
    // exclude = ID video yang tidak perlu direkomendasikan lagi
    getRecommendations({ artists = [], exclude = [] } = {}) {

        const params = new URLSearchParams();

        artists.forEach(artist => params.append("artist", artist));
        exclude.forEach(id => params.append("exclude", id));

        const query = params.toString();

        return this.request(
            "/api/youtube/recommendations" + (query ? "?" + query : "")
        );
    },

    // =====================================
    // PLAYLIST
    // =====================================

    getPlaylists() {
        return this.request("/api/playlists");
    },

    createPlaylist(name, description = "") {
        return this.request(
            "/api/playlists",
            this.json("POST", { name, description })
        );
    },

    getPlaylist(id) {
        return this.request(`/api/playlists/${id}`);
    },

    deletePlaylist(id) {
        return this.request(`/api/playlists/${id}`, { method: "DELETE" });
    },

    // =====================================
    // ISI PLAYLIST
    // =====================================

    getPlaylistItems(id) {
        return this.request(`/api/playlists/${id}/items`);
    },

    addToPlaylist(id, song) {
        return this.request(
            `/api/playlists/${id}/items`,
            this.json("POST", {
                youtubeVideoId: song.youtubeVideoId,
                title: song.title,
                artist: song.artist,
                thumbnailUrl: song.thumbnailUrl || ""
            })
        );
    },

    removePlaylistItem(playlistId, itemId) {
        return this.request(
            `/api/playlists/${playlistId}/items/${itemId}`,
            { method: "DELETE" }
        );
    }
};
