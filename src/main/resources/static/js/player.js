/*
 * MELODIFY - PLAYER.JS
 * Pemutar musik berbasis YouTube IFrame Player API.
 *
 * Halaman hanya perlu menyediakan:
 *   <div id="youtube-player"></div>
 * Script YouTube IFrame API dimuat oleh file ini, jadi tidak perlu
 * ditambahkan di HTML. Dengan begitu tidak ada lagi balapan antara
 * "API siap" dan "elemen belum ada".
 */

const HISTORY_KEY = "melodify.history";
const HISTORY_LIMIT = 30;

const MelodifyPlayer = {

    yt: null,
    apiReady: false,
    domReady: false,
    ready: false,

    queue: [],
    index: -1,
    current: null,

    playing: false,
    loaded: false,       // lagu saat ini sudah dimuat ke iframe
    recorded: false,     // lagu saat ini sudah dicatat ke riwayat
    pendingPlay: null,   // permintaan putar sebelum player siap
    errorStreak: 0,
    dragging: false,
    volume: 70,
    timer: null,

    // =========================================
    // RIWAYAT PUTAR (localStorage)
    // =========================================

    getHistory() {
        try {
            const data = JSON.parse(
                localStorage.getItem(HISTORY_KEY) || "[]"
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    },

    addToHistory(song) {

        const entry = {
            youtubeVideoId: song.youtubeVideoId,
            title: song.title,
            artist: song.artist,
            thumbnailUrl: song.thumbnailUrl || "",
            playedAt: Date.now()
        };

        const history = this.getHistory().filter(
            item => item.youtubeVideoId !== entry.youtubeVideoId
        );

        history.unshift(entry);

        try {
            localStorage.setItem(
                HISTORY_KEY,
                JSON.stringify(history.slice(0, HISTORY_LIMIT))
            );
        } catch (error) {
            // penyimpanan penuh / diblokir: abaikan
        }

        this.emit("melodify:history-change", {});
    },

    // =========================================
    // INISIALISASI
    // =========================================

    loadApi() {

        if (window.YT && window.YT.Player) {
            this.apiReady = true;
            return;
        }

        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    },

    // Player dibuat setelah API siap DAN elemen #youtube-player ada
    boot() {

        if (!this.apiReady || !this.domReady || this.yt) return;

        if (!document.getElementById("youtube-player")) {
            console.warn("Elemen #youtube-player tidak ditemukan.");
            return;
        }

        const playerVars = {
            playsinline: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            disablekb: 1
        };

        if (location.protocol.startsWith("http")) {
            playerVars.origin = location.origin;
        }

        this.yt = new YT.Player("youtube-player", {
            width: "100%",
            height: "100%",
            playerVars,
            events: {
                onReady: () => this.handleReady(),
                onStateChange: (event) => this.handleStateChange(event),
                onError: (event) => this.handleError(event)
            }
        });
    },

    handleReady() {

        this.ready = true;
        this.yt.setVolume(this.volume);

        this.timer = setInterval(() => this.updateProgress(), 500);

        // Ada lagu yang diminta sebelum player siap
        if (this.pendingPlay !== null) {
            const autoplay = this.pendingPlay;
            this.pendingPlay = null;
            this.loadCurrent(autoplay);
        }

        this.updateUI();
    },

    emit(name, detail = {}) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    },

    // =========================================
    // ANTREAN & PEMUTARAN
    // =========================================

    setQueue(songs, startIndex = 0, autoplay = true) {

        if (!Array.isArray(songs) || songs.length === 0) return;

        const target = songs[startIndex];

        this.queue = songs.filter(song => song && song.youtubeVideoId);

        if (this.queue.length === 0) return;

        let index = target
            ? this.queue.findIndex(
                song => song.youtubeVideoId === target.youtubeVideoId
            )
            : 0;

        if (index < 0) index = 0;

        this.errorStreak = 0;
        this.playIndex(index, autoplay);
    },

    playIndex(index, autoplay = true) {

        if (index < 0 || index >= this.queue.length) return;

        this.index = index;
        this.current = this.queue[index];

        this.emit("melodify:song-change", { song: this.current });

        if (autoplay) this.showVideo(true);

        this.loadCurrent(autoplay);
        this.updateUI();
    },

    playSong(song) {
        this.setQueue([song], 0, true);
    },

    // Memuat lagu saat ini ke iframe
    loadCurrent(autoplay = true) {

        if (!this.current) return;

        this.loaded = true;
        this.recorded = false;

        if (!this.ready) {
            this.pendingPlay = autoplay;
            return;
        }

        const id = this.current.youtubeVideoId;

        if (autoplay) {
            this.yt.loadVideoById(id);
        } else {
            this.yt.cueVideoById(id);
        }
    },

    togglePlay() {

        if (!this.current) {
            MelodifyUI.toast("Pilih lagu terlebih dahulu.");
            return;
        }

        if (!this.ready) {
            this.pendingPlay = true;
            return;
        }

        // Lagu terakhir dipulihkan dari riwayat tetapi belum dimuat
        if (!this.loaded) {
            this.showVideo(true);
            this.loadCurrent(true);
            return;
        }

        const state = this.yt.getPlayerState();

        if (
            state === YT.PlayerState.PLAYING ||
            state === YT.PlayerState.BUFFERING
        ) {
            this.yt.pauseVideo();
        } else {
            this.yt.playVideo();
        }
    },

    next() {

        if (this.queue.length === 0) return;

        if (this.queue.length === 1) {
            this.seekToSeconds(0);
            return;
        }

        this.playIndex((this.index + 1) % this.queue.length);
    },

    previous() {

        if (this.queue.length === 0) return;

        // Sudah lewat 3 detik: ulangi lagu ini
        if (this.ready && this.loaded && this.yt.getCurrentTime() > 3) {
            this.seekToSeconds(0);
            return;
        }

        this.playIndex(
            (this.index - 1 + this.queue.length) % this.queue.length
        );
    },

    seekToSeconds(seconds) {
        if (this.ready && this.loaded) {
            this.yt.seekTo(seconds, true);
        }
    },

    seekToPercent(percent) {

        if (!this.ready || !this.loaded) return;

        const duration = this.yt.getDuration();

        if (!duration || duration <= 0) return;

        const value = Math.max(0, Math.min(100, Number(percent) || 0));

        this.yt.seekTo((value / 100) * duration, true);
        this.updateProgress(true);
    },

    setVolume(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) return;

        this.volume = Math.max(0, Math.min(100, number));

        if (this.ready) this.yt.setVolume(this.volume);

        this.updateUI();
    },

    // =========================================
    // EVENT DARI YOUTUBE
    // =========================================

    handleStateChange(event) {

        const state = event.data;

        this.playing = state === YT.PlayerState.PLAYING;

        if (this.playing) {

            this.errorStreak = 0;

            // Dicatat setelah benar-benar terputar, bukan saat diklik
            if (!this.recorded && this.current) {
                this.recorded = true;
                this.addToHistory(this.current);
            }
        }

        if (state === YT.PlayerState.ENDED) {
            this.playing = false;
            this.next();
        }

        this.updateUI();

        this.emit("melodify:player-state", {
            playing: this.playing,
            state
        });
    },

    handleError(event) {

        const code = event.data;

        console.error("YouTube Player Error:", code);

        const reasons = {
            2: "ID video tidak valid.",
            5: "Video tidak bisa diputar di pemutar HTML5.",
            100: "Video tidak ditemukan atau bersifat privat.",
            101: "Pemilik video melarang pemutaran di situs lain.",
            150: "Pemilik video melarang pemutaran di situs lain.",
            153: "Pemutar YouTube tidak menerima asal halaman ini. " +
                "Buka lewat http://localhost:8080, bukan file langsung."
        };

        this.playing = false;
        this.updateUI();

        MelodifyUI.toast(
            reasons[code] || "Video tidak dapat diputar.",
            "error"
        );

        this.emit("melodify:player-error", { code, song: this.current });

        // Lewati ke lagu berikutnya, tetapi berhenti jika semuanya gagal
        this.errorStreak += 1;

        if (
            this.queue.length > 1 &&
            this.errorStreak < this.queue.length
        ) {
            setTimeout(() => this.next(), 1200);
        }
    },

    // =========================================
    // TAMPILAN
    // =========================================

    showVideo(visible) {

        const dock = document.getElementById("video-dock");
        const button = document.getElementById("player-video-btn");

        if (dock) dock.classList.toggle("is-hidden", !visible);

        if (button) {
            button.classList.toggle("active", visible);
            button.setAttribute("aria-pressed", String(visible));
        }
    },

    toggleVideo() {
        const dock = document.getElementById("video-dock");
        if (dock) this.showVideo(dock.classList.contains("is-hidden"));
    },

    formatTime(seconds) {

        if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

        const minutes = Math.floor(seconds / 60);
        const rest = Math.floor(seconds % 60);

        return `${minutes}:${String(rest).padStart(2, "0")}`;
    },

    setRangeFill(input, percent) {
        input.style.setProperty("--value", `${percent}%`);
    },

    updateProgress(force = false) {

        if (!this.ready || !this.loaded) return;
        if (this.dragging && !force) return;

        const current = this.yt.getCurrentTime() || 0;
        const duration = this.yt.getDuration() || 0;
        const percent = duration > 0 ? (current / duration) * 100 : 0;

        const progress = document.getElementById("player-progress");
        const currentText = document.getElementById("player-current-time");
        const durationText = document.getElementById("player-duration");

        if (progress) {
            progress.value = percent;
            this.setRangeFill(progress, percent);
        }

        if (currentText) currentText.textContent = this.formatTime(current);
        if (durationText) durationText.textContent = this.formatTime(duration);
    },

    updateUI() {

        const song = this.current;

        const title = document.getElementById("player-title");
        const artist = document.getElementById("player-artist");
        const thumbnail = document.getElementById("player-thumbnail");
        const playButton = document.getElementById("player-play-btn");
        const volume = document.getElementById("player-volume");

        if (title) {
            title.textContent = song ? song.title : "Belum ada lagu";
        }

        if (artist) {
            artist.textContent = song ? song.artist : "Pilih lagu untuk diputar";
        }

        if (thumbnail) {

            const url = song
                ? (song.thumbnailUrl ||
                    `https://img.youtube.com/vi/${song.youtubeVideoId}/mqdefault.jpg`)
                : "";

            thumbnail.style.backgroundImage = url ? `url("${url}")` : "";
            thumbnail.classList.toggle("g1", !url);
        }

        if (playButton) {

            const use = playButton.querySelector("use");

            if (use) {
                use.setAttribute("href", this.playing ? "#i-pause" : "#i-play");
            }

            playButton.setAttribute(
                "aria-label",
                this.playing ? "Jeda" : "Putar"
            );
        }

        if (volume) {
            volume.value = this.volume;
            this.setRangeFill(volume, this.volume);
        }
    },

    bindUI() {

        const byId = (id) => document.getElementById(id);

        byId("player-play-btn")
            ?.addEventListener("click", () => this.togglePlay());

        byId("player-next-btn")
            ?.addEventListener("click", () => this.next());

        byId("player-prev-btn")
            ?.addEventListener("click", () => this.previous());

        byId("player-video-btn")
            ?.addEventListener("click", () => this.toggleVideo());

        byId("player-volume")
            ?.addEventListener("input", (event) => {
                this.setVolume(event.target.value);
            });

        const progress = byId("player-progress");

        if (progress) {

            progress.addEventListener("pointerdown", () => {
                this.dragging = true;
            });

            progress.addEventListener("input", () => {
                this.setRangeFill(progress, progress.value);
            });

            // Seek dilakukan saat slider dilepas agar tidak tersendat
            progress.addEventListener("change", () => {
                this.dragging = false;
                this.seekToPercent(progress.value);
            });

            window.addEventListener("pointerup", () => {
                this.dragging = false;
            });
        }
    }
};

// Dipanggil YouTube setelah iframe_api selesai dimuat
window.onYouTubeIframeAPIReady = function () {
    MelodifyPlayer.apiReady = true;
    MelodifyPlayer.boot();
};

(function startPlayer() {

    MelodifyPlayer.domReady = document.readyState !== "loading";

    const onDomReady = () => {

        MelodifyPlayer.domReady = true;
        MelodifyPlayer.bindUI();

        // Tampilkan lagu terakhir di bar pemutar (belum dimuat ke iframe)
        const last = MelodifyPlayer.getHistory()[0];

        if (last) {
            MelodifyPlayer.queue = [last];
            MelodifyPlayer.index = 0;
            MelodifyPlayer.current = last;
        }

        MelodifyPlayer.updateUI();
        MelodifyPlayer.boot();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onDomReady);
    } else {
        onDomReady();
    }

    MelodifyPlayer.loadApi();
})();
