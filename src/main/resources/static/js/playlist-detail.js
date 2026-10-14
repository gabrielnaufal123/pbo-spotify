/*
 * MELODIFY - PLAYLIST-DETAIL.JS (halaman Detail Playlist)
 */

(function () {

    const rows = document.getElementById("playlist-song-rows");
    const nameEl = document.getElementById("pl-name");
    const descEl = document.getElementById("pl-description");
    const countEl = document.getElementById("pl-count");
    const coverEl = document.getElementById("pl-cover");
    const playAll = document.getElementById("play-all-btn");

    const playlistId = Number(new URLSearchParams(location.search).get("id"));

    let songs = [];

    function messageRow(text) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.className = "empty";
        cell.textContent = text;

        row.appendChild(cell);
        rows.replaceChildren(row);
    }

    function buildRow(item, index) {

        const row = document.createElement("tr");
        row.dataset.videoId = item.youtubeVideoId;

        const number = MelodifyUI.el("td", "num", String(index + 1));

        const titleCell = document.createElement("td");
        const info = MelodifyUI.el("div", "track-info");

        const thumb = document.createElement("img");
        thumb.className = "thumb-img";
        thumb.src = MelodifyUI.thumbUrl(item);
        thumb.alt = "";
        thumb.loading = "lazy";
        thumb.referrerPolicy = "no-referrer";

        const text = document.createElement("div");
        const title = MelodifyUI.el("strong", "", item.title);
        title.title = item.title;
        text.append(title, MelodifyUI.el("span", "", item.artist));

        info.append(thumb, text);
        titleCell.appendChild(info);

        const actions = MelodifyUI.el("td", "act");

        actions.append(
            MelodifyUI.iconButton(
                "play",
                `Putar ${item.title}`,
                "icon-btn",
                () => MelodifyPlayer.setQueue(songs, index)
            ),
            MelodifyUI.iconButton(
                "x",
                "Hapus dari playlist",
                "icon-btn",
                () => removeSong(item)
            )
        );

        actions.querySelector(".icon").classList.add("fill");

        row.append(number, titleCell, actions);

        return row;
    }

    async function load() {

        if (!Number.isInteger(playlistId) || playlistId <= 0) {
            nameEl.textContent = "Playlist tidak ditemukan";
            messageRow("ID playlist tidak valid.");
            return;
        }

        try {

            const [playlist, items] = await Promise.all([
                MelodifyAPI.getPlaylist(playlistId),
                MelodifyAPI.getPlaylistItems(playlistId)
            ]);

            document.title = `${playlist.name} — Melodify`;
            nameEl.textContent = playlist.name;
            descEl.textContent = playlist.description || "Tidak ada deskripsi";
            countEl.textContent = `${items.length} lagu`;
            coverEl.className = `cover xl ${MelodifyUI.gradientFor(playlist.id)}`;

            songs = items.map(item => ({
                id: item.id,
                youtubeVideoId: item.youtubeVideoId,
                title: item.title,
                artist: item.artist,
                thumbnailUrl: item.thumbnailUrl
            }));

            if (songs.length === 0) {
                messageRow(
                    "Playlist masih kosong. Tambahkan lagu dari halaman Lagu."
                );
                return;
            }

            rows.replaceChildren(...songs.map(buildRow));
            MelodifyUI.markPlaying();

        } catch (error) {

            console.error("Detail playlist:", error);

            nameEl.textContent = "Playlist tidak ditemukan";
            descEl.textContent = "";
            countEl.textContent = "";
            messageRow(error.message);
        }
    }

    async function removeSong(item) {

        if (!confirm(`Hapus "${item.title}" dari playlist?`)) return;

        try {

            await MelodifyAPI.removePlaylistItem(playlistId, item.id);

            MelodifyUI.toast("Lagu dihapus dari playlist.", "success");

            await load();
            MelodifyUI.loadSidebarPlaylists();

        } catch (error) {
            MelodifyUI.toast(error.message, "error");
        }
    }

    playAll.addEventListener("click", () => {

        if (songs.length === 0) {
            MelodifyUI.toast("Playlist masih kosong.");
            return;
        }

        MelodifyPlayer.setQueue(songs, 0);
    });

    load();
})();
