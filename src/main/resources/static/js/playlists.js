/*
 * MELODIFY - PLAYLISTS.JS (halaman Playlist)
 * Satu-satunya file yang memasang event pada form #create-playlist-form.
 * (Sebelumnya app.js dan file ini sama-sama memasangnya sehingga setiap
 * submit mengirim dua request dan playlist terbuat dobel.)
 */

(function () {

    const form = document.getElementById("create-playlist-form");
    const nameInput = document.getElementById("playlist-name");
    const descInput = document.getElementById("playlist-description");
    const submitButton = form.querySelector("button[type='submit']");
    const list = document.getElementById("playlist-list");
    const count = document.getElementById("playlist-count");

    let creating = false; // cegah klik ganda

    async function loadPlaylists() {

        try {

            const playlists = await MelodifyAPI.getPlaylists();

            count.textContent = `${playlists.length} playlist`;

            if (playlists.length === 0) {
                MelodifyUI.emptyState(
                    list,
                    "Belum ada playlist. Buat playlist pertamamu di atas!"
                );
                return;
            }

            list.replaceChildren();

            playlists.forEach(playlist => {
                list.appendChild(
                    MelodifyUI.playlistCard(playlist, deletePlaylist)
                );
            });

        } catch (error) {

            console.error("Playlist:", error);

            count.textContent = "Gagal memuat";
            MelodifyUI.errorState(
                list,
                "Gagal mengambil playlist: " + error.message,
                loadPlaylists
            );
        }
    }

    async function deletePlaylist(playlist) {

        const confirmed = confirm(
            `Hapus playlist "${playlist.name}" beserta seluruh isinya?`
        );

        if (!confirmed) return;

        try {

            await MelodifyAPI.deletePlaylist(playlist.id);

            MelodifyUI.toast("Playlist berhasil dihapus.", "success");

            await loadPlaylists();
            MelodifyUI.loadSidebarPlaylists();

        } catch (error) {
            MelodifyUI.toast(error.message, "error");
        }
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (creating) return;

        const name = nameInput.value.trim();
        const description = descInput.value.trim();

        if (!name) {
            MelodifyUI.toast("Nama playlist tidak boleh kosong.", "error");
            return;
        }

        creating = true;
        submitButton.disabled = true;

        try {

            await MelodifyAPI.createPlaylist(name, description);

            form.reset();

            MelodifyUI.toast("Playlist berhasil dibuat!", "success");

            await loadPlaylists();
            MelodifyUI.loadSidebarPlaylists();

        } catch (error) {

            MelodifyUI.toast(error.message, "error");

        } finally {

            creating = false;
            submitButton.disabled = false;
        }
    });

    loadPlaylists();
})();
