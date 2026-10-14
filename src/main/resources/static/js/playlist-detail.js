document.addEventListener("DOMContentLoaded", () => {

    const tbody = document.getElementById(
        "playlist-song-rows"
    );

    if (!tbody) return;

    const params = new URLSearchParams(
        window.location.search
    );

    const playlistId = Number(params.get("id"));

    const message = document.getElementById(
        "detail-message"
    );

    const playAllButton = document.getElementById(
        "play-all-btn"
    );

    let currentSongs = [];

    function showMessage(text) {
        message.textContent = text;
    }

    // Mengambil playlist dan lagu dari Kotlin
    async function loadPlaylistDetail() {

        if (
            !Number.isInteger(playlistId) ||
            playlistId <= 0
        ) {

            showMessage("ID playlist tidak valid.");
            return;
        }

        try {

            const [playlist, items] = await Promise.all([
                MelodifyAPI.getPlaylist(playlistId),
                MelodifyAPI.getPlaylistItems(playlistId)
            ]);

            document.getElementById("pl-name")
                .textContent = playlist.name;

            document.getElementById("pl-description")
                .textContent = playlist.description;

            document.getElementById("pl-count")
                .textContent = `${items.length} lagu`;

            // Menyesuaikan format item database
            // dengan format yang digunakan player.js
            currentSongs = items.map(item => ({
                id: item.id,
                youtubeVideoId: item.youtubeVideoId,
                title: item.title,
                artist: item.artist,
                thumbnailUrl: item.thumbnailUrl
            }));

            // Memberikan daftar lagu ke player.js
            setPlaylist(currentSongs);

            tbody.replaceChildren();

            if (items.length === 0) {

                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 4;
                cell.textContent =
                    "Playlist masih kosong. Tambahkan lagu dari halaman pencarian.";

                row.appendChild(cell);
                tbody.appendChild(row);

                return;
            }

            items.forEach((item, index) => {

                const row = document.createElement("tr");

                const number = document.createElement("td");
                number.textContent = index + 1;

                const title = document.createElement("td");
                title.textContent = item.title;

                const artist = document.createElement("td");
                artist.textContent = item.artist;

                const action = document.createElement("td");

                // Tombol memutar lagu
                const playButton = document.createElement("button");

                playButton.type = "button";
                playButton.textContent = "▶";
                playButton.title = "Putar lagu";

                playButton.addEventListener("click", () => {
                    playSong(index);
                });

                // Tombol menghapus lagu
                const removeButton = document.createElement("button");

                removeButton.type = "button";
                removeButton.textContent = "Hapus";
                removeButton.className = "remove-song-btn";

                removeButton.addEventListener("click", async () => {

                    const confirmed = confirm(
                        `Hapus "${item.title}" dari playlist?`
                    );

                    if (!confirmed) return;

                    try {

                        await MelodifyAPI.removePlaylistItem(
                            playlistId,
                            item.id
                        );

                        showMessage("Lagu berhasil dihapus.");

                        await loadPlaylistDetail();

                    } catch (error) {

                        showMessage(error.message);
                    }
                });

                action.append(playButton, removeButton);

                row.append(
                    number,
                    title,
                    artist,
                    action
                );

                tbody.appendChild(row);
            });

        } catch (error) {

            console.error(error);

            showMessage(
                "Gagal mengambil detail playlist: " +
                error.message
            );
        }
    }

    // Memutar semua lagu mulai dari lagu pertama
    playAllButton.addEventListener("click", () => {

        if (currentSongs.length === 0) {

            showMessage("Playlist masih kosong.");
            return;
        }

        setPlaylist(currentSongs);
        playSong(0);
    });

    loadPlaylistDetail();
});