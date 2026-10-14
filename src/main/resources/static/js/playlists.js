document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("playlist-list");
    const form = document.getElementById("create-playlist-form");

    if (!container || !form) return;

    const message = document.getElementById("playlist-message");

    function showMessage(text) {
        message.textContent = text;
    }

    // Menampilkan semua playlist dari MySQL
    async function loadPlaylists() {

        try {

            const playlists = await MelodifyAPI.getPlaylists();

            container.replaceChildren();

            if (playlists.length === 0) {
                container.textContent =
                    "Belum ada playlist. Buat playlist pertamamu!";
                return;
            }

            playlists.forEach(playlist => {

                const card = document.createElement("div");
                card.className = "card playlist-card";

                const link = document.createElement("a");

                link.href =
                    `playlistdtl.html?id=${playlist.id}`;

                const cover = document.createElement("div");
                cover.className = "cover g1";
                cover.textContent = "♫";

                const title = document.createElement("p");
                title.className = "card-title";
                title.textContent = playlist.name;

                const subtitle = document.createElement("p");
                subtitle.className = "card-sub";
                subtitle.textContent =
                    `${playlist.totalSongs} lagu`;

                link.append(cover, title, subtitle);

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "playlist-delete";
                deleteButton.textContent = "Hapus Playlist";

                deleteButton.addEventListener("click", async () => {

                    const confirmed = confirm(
                        `Hapus playlist "${playlist.name}" beserta seluruh isinya?`
                    );

                    if (!confirmed) return;

                    try {

                        await MelodifyAPI.deletePlaylist(playlist.id);

                        showMessage("Playlist berhasil dihapus.");

                        await loadPlaylists();

                    } catch (error) {

                        showMessage(error.message);
                    }
                });

                card.append(link, deleteButton);
                container.appendChild(card);
            });

        } catch (error) {

            console.error(error);

            showMessage("Gagal mengambil playlist dari MySQL.");
        }
    }

    // Membuat playlist baru
    form.addEventListener("submit", async event => {

        event.preventDefault();

        const name = document
            .getElementById("playlist-name")
            .value.trim();

        const description = document
            .getElementById("playlist-description")
            .value.trim();

        if (!name) {
            showMessage("Nama playlist tidak boleh kosong.");
            return;
        }

        try {

            await MelodifyAPI.createPlaylist(
                name,
                description
            );

            form.reset();

            showMessage("Playlist berhasil dibuat!");

            await loadPlaylists();

        } catch (error) {

            showMessage(error.message);
        }
    });

    loadPlaylists();
});