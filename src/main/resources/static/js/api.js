const MelodifyAPI = {

    async getAllSongs() {

        const response = await fetch("/api/songs");

        if (!response.ok) {
            throw new Error("Gagal mengambil lagu");
        }

        return await response.json();
    },

    async searchSongs(keyword) {

        const response = await fetch(
            "/api/songs/search?q=" +
            encodeURIComponent(keyword)
        );

        if (!response.ok) {
            throw new Error("Gagal mencari lagu");
        }

        return await response.json();
    }
};