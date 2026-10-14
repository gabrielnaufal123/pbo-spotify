/*
 * MELODIFY - APP.JS
 * Komponen UI yang dipakai bersama oleh semua halaman:
 * toast, kartu lagu, kartu playlist, sidebar, dan dialog "tambah ke playlist".
 *
 * Logika tiap halaman ada di file masing-masing
 * (home.js, songs.js, playlists.js, playlist-detail.js).
 * Satu form/tombol hanya boleh dipasang event-nya oleh SATU file.
 */

const MelodifyUI = {

    gradients: ["g1", "g2", "g3", "g4", "g5", "g6", "g7"],

    // =========================================
    // HELPER DOM
    // =========================================

    el(tag, className = "", text = "") {

        const element = document.createElement(tag);

        if (className) element.className = className;
        if (text) element.textContent = text;

        return element;
    },

    icon(name, extraClass = "") {

        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        const use = document.createElementNS(ns, "use");

        svg.setAttribute("class", `icon ${extraClass}`.trim());
        use.setAttribute("href", `#i-${name}`);
        svg.appendChild(use);

        return svg;
    },

    iconButton(iconName, label, className, onClick) {

        const button = this.el("button", className);

        button.type = "button";
        button.setAttribute("aria-label", label);
        button.title = label;
        button.appendChild(this.icon(iconName));
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onClick();
        });

        return button;
    },

    gradientFor(id) {
        return this.gradients[Math.abs(Number(id) || 0) % this.gradients.length];
    },

    thumbUrl(song) {
        return song.thumbnailUrl ||
            `https://img.youtube.com/vi/${song.youtubeVideoId}/mqdefault.jpg`;
    },

    // =========================================
    // TOAST
    // =========================================

    toast(message, type = "info") {

        let stack = document.getElementById("toast-stack");

        if (!stack) {
            stack = this.el("div", "toast-stack");
            stack.id = "toast-stack";
            stack.setAttribute("role", "status");
            document.body.appendChild(stack);
        }

        const toast = this.el("div", `toast ${type}`, message);

        stack.appendChild(toast);

        setTimeout(() => toast.remove(), 3500);
    },

    // =========================================
    // KARTU LAGU
    // =========================================

    /*
     * song  : { youtubeVideoId, title, artist, thumbnailUrl }
     * queue : daftar lagu yang menjadi antrean saat kartu ini diputar
     */
    songCard(song, queue, index) {

        const card = this.el("article", "song-card");
        card.dataset.videoId = song.youtubeVideoId;

        const cover = this.el("div", "song-cover");

        const image = document.createElement("img");
        image.src = this.thumbUrl(song);
        image.alt = "";
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        image.addEventListener("error", () => {
            image.remove();
            cover.classList.add(this.gradientFor(index));
        });

        const playButton = this.iconButton(
            "play",
            `Putar ${song.title}`,
            "song-play",
            () => MelodifyPlayer.setQueue(queue, index)
        );
        playButton.querySelector(".icon").classList.add("fill");

        const addButton = this.iconButton(
            "plus",
            "Tambah ke playlist",
            "cover-btn",
            () => this.pickPlaylist(song)
        );

        cover.append(image, playButton, addButton);

        const title = this.el("p", "song-title", song.title);
        title.title = song.title;

        const artist = this.el("p", "song-artist", song.artist);

        card.append(cover, title, artist);

        return card;
    },

    renderSongGrid(container, songs) {

        container.replaceChildren();

        songs.forEach((song, index) => {
            container.appendChild(this.songCard(song, songs, index));
        });

        this.markPlaying();
    },

    skeletonGrid(container, count = 5) {

        container.replaceChildren();

        for (let i = 0; i < count; i++) {

            const card = this.el("div", "song-card skeleton");

            card.append(
                this.el("div", "song-cover"),
                this.el("div", "line"),
                this.el("div", "line short")
            );

            container.appendChild(card);
        }
    },

    // Tandai kartu / baris yang sedang diputar
    markPlaying() {

        const currentId = MelodifyPlayer.current?.youtubeVideoId;

        document.querySelectorAll("[data-video-id]").forEach(element => {
            element.classList.toggle(
                "is-playing",
                !!currentId && element.dataset.videoId === currentId
            );
        });
    },

    // =========================================
    // STATUS KOSONG / ERROR
    // =========================================

    emptyState(container, message, linkText, linkHref) {

        const box = this.el("div", "state-box");

        box.appendChild(this.el("span", "", message));

        if (linkText) {
            const link = this.el("a", "", linkText);
            link.href = linkHref;
            box.appendChild(link);
        }

        container.replaceChildren(box);
    },

    errorState(container, message, onRetry) {

        const box = this.el("div", "state-box error");

        box.appendChild(this.el("span", "", message));

        if (onRetry) {
            const retry = this.el("button", "btn ghost", "Coba lagi");
            retry.type = "button";
            retry.addEventListener("click", onRetry);
            box.appendChild(retry);
        }

        container.replaceChildren(box);
    },

    // =========================================
    // KARTU PLAYLIST
    // =========================================

    playlistCard(playlist, onDelete) {

        const wrapper = this.el("div", "playlist-card");

        const link = this.el("a", "card");
        link.href = `playlistdtl.html?id=${playlist.id}`;

        const cover = this.el("div", `cover ${this.gradientFor(playlist.id)}`);
        cover.appendChild(this.icon("list"));

        const title = this.el("p", "card-title", playlist.name);
        title.title = playlist.name;

        const sub = this.el("p", "card-sub", `${playlist.totalSongs || 0} lagu`);

        link.append(cover, title, sub);
        wrapper.appendChild(link);

        if (onDelete) {
            wrapper.appendChild(
                this.iconButton(
                    "x",
                    `Hapus playlist ${playlist.name}`,
                    "cover-btn danger",
                    () => onDelete(playlist)
                )
            );
        }

        return wrapper;
    },

    // =========================================
    // SIDEBAR
    // =========================================

    async loadSidebarPlaylists() {

        const nav = document.getElementById("side-playlist-items");

        if (!nav) return;

        const activeId = new URLSearchParams(location.search).get("id");
        const onDetailPage = location.pathname.endsWith("playlistdtl.html");

        try {

            const playlists = await MelodifyAPI.getPlaylists();

            nav.replaceChildren();

            playlists.slice(0, 8).forEach(playlist => {

                const link = this.el("a");
                link.href = `playlistdtl.html?id=${playlist.id}`;

                if (onDetailPage && String(playlist.id) === activeId) {
                    link.classList.add("active");
                }

                const mini = this.el("span", `mini ${this.gradientFor(playlist.id)}`);
                const name = this.el("span", "", playlist.name);
                name.style.overflow = "hidden";
                name.style.textOverflow = "ellipsis";
                name.style.whiteSpace = "nowrap";

                link.append(mini, name);
                nav.appendChild(link);
            });

        } catch (error) {
            nav.replaceChildren();
            console.error("Sidebar playlist:", error);
        }
    },

    // =========================================
    // DIALOG TAMBAH KE PLAYLIST
    // =========================================

    async pickPlaylist(song) {

        let playlists;

        try {
            playlists = await MelodifyAPI.getPlaylists();
        } catch (error) {
            this.toast("Gagal mengambil playlist: " + error.message, "error");
            return;
        }

        const backdrop = this.el("div", "modal-backdrop");
        const modal = this.el("div", "modal");

        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-label", "Tambah ke playlist");

        const head = this.el("div");
        head.append(
            this.el("h3", "", "Tambah ke playlist"),
            this.el("p", "muted", song.title)
        );

        const close = () => {
            backdrop.remove();
            document.removeEventListener("keydown", onKey);
        };

        const onKey = (event) => {
            if (event.key === "Escape") close();
        };

        const addTo = async (playlistId, playlistName) => {

            try {

                await MelodifyAPI.addToPlaylist(playlistId, song);

                this.toast(`Ditambahkan ke "${playlistName}"`, "success");
                close();
                this.loadSidebarPlaylists();

                window.dispatchEvent(
                    new CustomEvent("melodify:playlist-change")
                );

            } catch (error) {
                this.toast(error.message, "error");
            }
        };

        const list = this.el("div", "modal-list");

        if (playlists.length === 0) {
            list.appendChild(
                this.el("p", "muted", "Belum ada playlist. Buat satu di bawah.")
            );
        }

        playlists.forEach(playlist => {

            const row = this.el("button");
            row.type = "button";

            const info = this.el("span");
            info.append(
                this.el("span", "", playlist.name),
                this.el("small", "", `${playlist.totalSongs || 0} lagu`)
            );

            row.append(
                this.el("span", `mini ${this.gradientFor(playlist.id)}`),
                info
            );

            row.addEventListener("click", () => addTo(playlist.id, playlist.name));
            list.appendChild(row);
        });

        // Buat playlist baru langsung dari dialog
        const form = this.el("form", "modal-new");
        const input = document.createElement("input");

        input.placeholder = "Nama playlist baru";
        input.maxLength = 150;
        input.required = true;

        const submit = this.el("button", "btn primary", "Buat & tambah");
        submit.type = "submit";

        form.append(input, submit);

        form.addEventListener("submit", async (event) => {

            event.preventDefault();

            const name = input.value.trim();

            if (!name) return;

            submit.disabled = true;

            try {
                const created = await MelodifyAPI.createPlaylist(name, "");
                await addTo(created.id, created.name);
            } catch (error) {
                this.toast(error.message, "error");
            } finally {
                submit.disabled = false;
            }
        });

        const cancel = this.el("button", "btn ghost close", "Batal");
        cancel.type = "button";
        cancel.addEventListener("click", close);

        modal.append(head, list, form, cancel);
        backdrop.appendChild(modal);

        backdrop.addEventListener("click", (event) => {
            if (event.target === backdrop) close();
        });

        document.addEventListener("keydown", onKey);
        document.body.appendChild(backdrop);

        input.focus();
    }
};

// Sorot lagu yang sedang diputar di semua halaman
window.addEventListener("melodify:song-change", () => MelodifyUI.markPlaying());

// Sidebar dimuat di setiap halaman
MelodifyUI.loadSidebarPlaylists();
