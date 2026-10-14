// ========================================
// MELODIFY - HOME PAGE
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("recommended");

    // Hanya berjalan pada halaman yang memiliki rekomendasi
    if (!container) return;

    async function loadRecommendations() {

        try {

            container.textContent = "Memuat rekomendasi...";

            // Mengambil rekomendasi melalui Kotlin
            const songs = await MelodifyAPI.getRecommendations();

            container.replaceChildren();

            if (songs.length === 0) {
                container.textContent =
                    "Belum ada rekomendasi tersedia.";
                return;
            }

            // Daftar ini digunakan oleh player.js
            setPlaylist(songs);

            songs.slice(0, 4).forEach((song, index) => {

                const card = document.createElement("div");
                card.className = "card recommendation-card";

                // Cover lagu
                const cover = document.createElement("div");
                cover.className = "cover recommendation-cover";

                if (song.thumbnailUrl) {

                    const image = document.createElement("img");

                    image.src = song.thumbnailUrl;
                    image.alt = song.title;
                    image.loading = "lazy";

                    cover.appendChild(image);

                } else {

                    cover.textContent = "♫";
                }

                // Judul lagu
                const title = document.createElement("p");

                title.className = "card-title";
                title.textContent = song.title;

                // Artis / channel
                const artist = document.createElement("p");

                artist.className = "card-sub";
                artist.textContent = song.artist;

                // Tombol putar
                const playButton = document.createElement("button");

                playButton.type = "button";
                playButton.className = "recommendation-play";
                playButton.textContent = "▶ Putar";

                playButton.addEventListener("click", () => {

                    setPlaylist(songs);
                    playSong(index);
                });

                card.append(
                    cover,
                    title,
                    artist,
                    playButton
                );

                container.appendChild(card);
            });

        } catch (error) {

            console.error(error);

            container.textContent =
                "Gagal mengambil rekomendasi YouTube.";
        }
    }

    loadRecommendations();
});