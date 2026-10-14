async function addSongToPlaylist(song) {

    try {

        const playlists = await MelodifyAPI.getPlaylists();

        if (playlists.length === 0) {
            alert(
                "Belum ada playlist. Buat playlist terlebih dahulu."
            );
            return;
        }

        const options = playlists
            .map(playlist => {
                return `${playlist.id} - ${playlist.name}`;
            })
            .join("\n");

        const selected = prompt(
            "Pilih ID playlist:\n\n" + options
        );

        if (selected === null) return;

        const playlistId = Number(selected);

        if (!Number.isInteger(playlistId) ||
            !playlists.some(p => p.id === playlistId)) {

            alert("ID playlist tidak valid.");
            return;
        }

        await MelodifyAPI.addToPlaylist(
            playlistId,
            song
        );

        alert(
            `"${song.title}" berhasil ditambahkan ke playlist!`
        );

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", async function () {

    console.log("app.js berhasil dijalankan!");

    const addButton = document.createElement("button");

    addButton.textContent = "+ Playlist";
    addButton.className = "icon-btn";
    addButton.type = "button";

    addButton.addEventListener("click", function (event) {

        event.stopPropagation();

        addSongToPlaylist(song);
    });

    action.replaceChildren(addButton);

    const tbody = document.getElementById("song-rows");

    // Jika bukan halaman songs.html, jangan jalankan kode ini
    if (!tbody) {
        return;
    }

    try {

        // 1. Mengambil data dari Kotlin
        // Membaca keyword dari URL
        const params = new URLSearchParams(window.location.search);

        const keyword = params.get("q") || "";

// Menampilkan kembali keyword di search bar
        const searchInput = document.querySelector(
            '.search input[name="q"]'
        );

        if (searchInput) {
            searchInput.value = keyword;
        }

    // Jika ada keyword, lakukan pencarian
    // Jika kosong, tampilkan seluruh lagu
        const songs = keyword.trim()
            ? await MelodifyAPI.searchSongs(keyword)
            : await MelodifyAPI.getAllSongs();

        // 2. Menghapus tulisan loading / data dummy
        tbody.innerHTML = "";

        // 3. Mengubah jumlah lagu
        const songCount = document.getElementById("song-count");

        if (songCount) {
            songCount.textContent = songs.length + " lagu";
        }

        // 4. Menampilkan setiap lagu
        songs.forEach((song, index) => {

            const row = document.createElement("tr");

            const number = document.createElement("td");
            number.className = "num";
            number.textContent = index + 1;

            const titleCell = document.createElement("td");

            const trackInfo = document.createElement("div");
            trackInfo.className = "track-info";

            const thumb = document.createElement("span");
            thumb.className = `thumb g${(index % 7) + 1}`;

            const textWrapper = document.createElement("div");

            const title = document.createElement("strong");
            title.textContent = song.title;

            const artist = document.createElement("span");
            artist.textContent = song.artist;

            textWrapper.append(title, artist);
            trackInfo.append(thumb, textWrapper);
            titleCell.appendChild(trackInfo);

            const album = document.createElement("td");
            album.className = "hide-sm muted";
            album.textContent = song.albumTitle;

            const duration = document.createElement("td");
            duration.className = "muted";

            const minutes = Math.floor(song.duration / 60);
            const seconds = song.duration % 60;

            duration.textContent =
                `${minutes}:${String(seconds).padStart(2, "0")}`;

            const action = document.createElement("td");
            action.className = "act";
            action.textContent = "—";

            row.append(
                number,
                titleCell,
                album,
                duration,
                action
            );

            tbody.appendChild(row);

        });

        console.log("Berhasil menampilkan", songs.length, "lagu!");

    } catch (error) {

        console.error("ERROR:", error);

        tbody.innerHTML = "";

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "Gagal mengambil data lagu.";

        row.appendChild(cell);
        tbody.appendChild(row);
    }

});