/*
 * MELODIFY - SONGS.JS (halaman Lagu)
 * Pencarian YouTube. Jika belum mencari, tampilkan rekomendasi.
 * Pencarian dari halaman lain datang lewat songs.html?q=kata+kunci
 */

(function () {

    const form = document.getElementById("search-form");
    const input = document.getElementById("search-input");
    const results = document.getElementById("search-results");
    const count = document.getElementById("song-count");
    const heading = document.getElementById("songs-heading");

    let requestId = 0; // mencegah hasil lama menimpa hasil baru

    async function search(keyword) {

        const current = ++requestId;

        heading.textContent = "Hasil Pencarian";
        count.textContent = "Mencari lagu...";
        MelodifyUI.skeletonGrid(results, 10);

        try {

            const songs = await MelodifyAPI.searchYouTube(keyword);

            if (current !== requestId) return;

            if (!Array.isArray(songs) || songs.length === 0) {
                count.textContent = "Tidak ada hasil";
                MelodifyUI.emptyState(
                    results,
                    `Tidak ada lagu yang cocok dengan "${keyword}".`
                );
                return;
            }

            count.textContent = `${songs.length} hasil untuk "${keyword}"`;
            MelodifyUI.renderSongGrid(results, songs);

        } catch (error) {

            if (current !== requestId) return;

            console.error("Pencarian:", error);

            count.textContent = "Pencarian gagal";
            MelodifyUI.errorState(
                results,
                "Gagal mencari lagu: " + error.message,
                () => search(keyword)
            );
        }
    }

    async function showSuggestions() {

        const current = ++requestId;
        const history = MelodifyPlayer.getHistory();

        heading.textContent = "Rekomendasi untukmu";
        count.textContent = "Cari lagu atau artis di kolom pencarian";
        MelodifyUI.skeletonGrid(results, 10);

        try {

            const songs = await MelodifyAPI.getRecommendations({
                artists: history.slice(0, 20).map(item => item.artist),
                exclude: history.slice(0, 30).map(item => item.youtubeVideoId)
            });

            if (current !== requestId) return;

            if (!songs || songs.length === 0) {
                MelodifyUI.emptyState(results, "Cari lagu favoritmu melalui kolom pencarian.");
                return;
            }

            MelodifyUI.renderSongGrid(results, songs);

        } catch (error) {

            if (current !== requestId) return;

            console.error("Rekomendasi:", error);

            MelodifyUI.emptyState(
                results,
                "Cari lagu favoritmu melalui kolom pencarian."
            );
        }
    }

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const keyword = input.value.trim();

        if (!keyword) {
            history.replaceState(null, "", "songs.html");
            showSuggestions();
            return;
        }

        history.replaceState(null, "", "songs.html?q=" + encodeURIComponent(keyword));
        search(keyword);
    });

    const initial = new URLSearchParams(location.search).get("q")?.trim();

    if (initial) {
        input.value = initial;
        search(initial);
    } else {
        showSuggestions();
    }
})();
