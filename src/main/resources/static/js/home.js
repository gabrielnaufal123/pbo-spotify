/*
 * MELODIFY - HOME.JS (halaman Beranda)
 * Rekomendasi, terakhir diputar, dan playlist semuanya berasal dari data nyata.
 */

(function () {

    const recommended = document.getElementById("recommended");
    const recent = document.getElementById("recent");
    const playlistBox = document.getElementById("home-playlists");

    // =========================================
    // REKOMENDASI (YouTube + riwayat putar + playlist)
    // =========================================

    async function loadRecommendations() {

        MelodifyUI.skeletonGrid(recommended, 5);

        const history = MelodifyPlayer.getHistory();

        try {

            const songs = await MelodifyAPI.getRecommendations({
                artists: history.slice(0, 20).map(item => item.artist),
                exclude: history.slice(0, 30).map(item => item.youtubeVideoId)
            });

            if (!Array.isArray(songs) || songs.length === 0) {
                MelodifyUI.emptyState(
                    recommended,
                    "Belum ada rekomendasi. Coba putar beberapa lagu dulu."
                );
                return;
            }

            MelodifyUI.renderSongGrid(recommended, songs.slice(0, 10));

        } catch (error) {

            console.error("Rekomendasi:", error);

            MelodifyUI.errorState(
                recommended,
                error.message || "Gagal mengambil rekomendasi YouTube.",
                loadRecommendations
            );
        }
    }

    // =========================================
    // TERAKHIR DIPUTAR (localStorage)
    // =========================================

    function loadRecent() {

        const history = MelodifyPlayer.getHistory().slice(0, 5);

        if (history.length === 0) {
            MelodifyUI.emptyState(
                recent,
                "Belum ada lagu yang diputar. Cari lagu favoritmu di halaman Lagu.",
                "Cari lagu",
                "songs.html"
            );
            return;
        }

        MelodifyUI.renderSongGrid(recent, history);
    }

    // =========================================
    // PLAYLIST KAMU
    // =========================================

    async function loadPlaylists() {

        try {

            const playlists = await MelodifyAPI.getPlaylists();

            if (playlists.length === 0) {
                MelodifyUI.emptyState(
                    playlistBox,
                    "Kamu belum punya playlist.",
                    "Buat playlist pertama",
                    "playlists.html"
                );
                return;
            }

            playlistBox.replaceChildren();

            playlists.slice(0, 5).forEach(playlist => {
                playlistBox.appendChild(MelodifyUI.playlistCard(playlist));
            });

        } catch (error) {

            console.error("Playlist:", error);

            MelodifyUI.errorState(
                playlistBox,
                "Gagal mengambil playlist: " + error.message,
                loadPlaylists
            );
        }
    }

    // "Terakhir diputar" ikut diperbarui saat lagu mulai terputar
    window.addEventListener("melodify:history-change", loadRecent);

    loadRecommendations();
    loadRecent();
    loadPlaylists();
})();
