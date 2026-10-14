
/*
 * MELODIFY - PLAYER.JS
 * Pemutar musik menggunakan YouTube IFrame Player API.
 *
 * HTML yang diperlukan:
 * <div id="youtube-player"></div>
 *
 * File ini harus dimuat sebelum app.js.
 */

const MelodifyPlayer = {

    player: null,
    ready: false,
    songs: [],
    currentIndex: -1,
    currentSong: null,
    playing: false,
    volume: 70,
    progressTimer: null,

    // Menyiapkan YouTube Player
    init() {
        if (!document.getElementById("youtube-player")) {
            console.warn("Elemen #youtube-player tidak ditemukan.");
            return;
        }

        if (window.YT && window.YT.Player) {
            this.createPlayer();
        }
    },

    createPlayer() {
        if (this.player) return;

        this.player = new YT.Player("youtube-player", {
            height: "180",
            width: "320",

            playerVars: {
                playsinline: 1,
                controls: 0,
                rel: 0,
                origin: window.location.origin
            },

            events: {
                onReady: (event) => {
                    this.ready = true;
                    event.target.setVolume(this.volume);
                    this.startProgressTimer();
                    this.updateUI();
                    console.log("Melodify Player siap.");
                },

                onStateChange: (event) => {
                    this.handleStateChange(event);
                },

                onError: (event) => {
                    console.error(
                        "YouTube Player Error:",
                        event.data
                    );

                    this.playing = false;
                    this.updateUI();
                    this.emit("melodify:player-error", {
                        code: event.data,
                        song: this.currentSong
                    });
                }
            }
        });
    },

    // Mengirim informasi perubahan player ke app.js
    emit(eventName, detail = {}) {
        window.dispatchEvent(
            new CustomEvent(eventName, { detail })
        );
    },

    // Memasukkan daftar lagu ke antrean
    setQueue(songs, startIndex = 0, autoplay = true) {
        if (!Array.isArray(songs) || songs.length === 0) {
            console.warn("Antrean lagu kosong.");
            return;
        }

        this.songs = songs.filter(song => song.youtubeVideoId);

        if (this.songs.length === 0) return;

        this.playIndex(startIndex, autoplay);
    },

    // Memutar lagu berdasarkan indeks antrean
    playIndex(index, autoplay = true) {
        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= this.songs.length
        ) {
            return;
        }

        const song = this.songs[index];

        if (!song || !song.youtubeVideoId) return;

        this.currentIndex = index;
        this.currentSong = song;

        this.emit("melodify:song-change", { song });
        this.updateUI();

        if (!this.ready || !this.player) {
            console.warn("YouTube Player belum siap.");
            return;
        }

        if (autoplay) {
            this.player.loadVideoById(song.youtubeVideoId);
        } else {
            this.player.cueVideoById(song.youtubeVideoId);
        }
    },

    // Memutar satu lagu dari hasil pencarian
    playSong(song) {
        if (!song || !song.youtubeVideoId) {
            console.error("Data lagu tidak valid:", song);
            return;
        }

        this.setQueue([song], 0, true);
    },

    // Play atau pause
    togglePlay() {
        if (!this.ready || !this.player) return;

        if (!this.currentSong) {
            if (this.songs.length > 0) {
                this.playIndex(0);
            }
            return;
        }

        const state = this.player.getPlayerState();

        if (state === YT.PlayerState.PLAYING) {
            this.player.pauseVideo();
        } else {
            this.player.playVideo();
        }
    },

    play() {
        if (!this.ready || !this.player) return;

        if (!this.currentSong && this.songs.length > 0) {
            this.playIndex(0);
            return;
        }

        this.player.playVideo();
    },

    pause() {
        if (this.ready && this.player) {
            this.player.pauseVideo();
        }
    },

    // Lagu selanjutnya
    next() {
        if (this.songs.length === 0) return;

        const nextIndex =
            (this.currentIndex + 1) % this.songs.length;

        this.playIndex(nextIndex);
    },

    // Lagu sebelumnya
    previous() {
        if (this.songs.length === 0) return;

        if (this.ready && this.player) {
            const currentTime = this.player.getCurrentTime();

            // Jika sudah lewat 3 detik, ulangi lagu saat ini
            if (currentTime > 3) {
                this.player.seekTo(0, true);
                return;
            }
        }

        const previousIndex =
            (this.currentIndex - 1 + this.songs.length) %
            this.songs.length;

        this.playIndex(previousIndex);
    },

    // Mengatur volume (0 sampai 100)
    setVolume(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) return;

        this.volume = Math.max(0, Math.min(100, number));

        if (this.ready && this.player) {
            this.player.setVolume(this.volume);
        }

        this.updateUI();
    },

    // Mengubah posisi pemutaran berdasarkan persentase
    seekTo(percent) {
        if (!this.ready || !this.player) return;

        const duration = this.player.getDuration();

        if (!duration || duration <= 0) return;

        const value = Math.max(
            0,
            Math.min(100, Number(percent) || 0)
        );

        this.player.seekTo(
            (value / 100) * duration,
            true
        );

        this.updateProgress();
    },

    // Mengubah detik menjadi mm:ss
    formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) {
            return "0:00";
        }

        const minutes = Math.floor(seconds / 60);
        const remaining = Math.floor(seconds % 60);

        return `${minutes}:${String(remaining).padStart(2, "0")}`;
    },

    handleStateChange(event) {
        const state = event.data;

        this.playing = state === YT.PlayerState.PLAYING;

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

    startProgressTimer() {
        if (this.progressTimer) return;

        this.progressTimer = setInterval(() => {
            this.updateProgress();
        }, 500);
    },

    updateProgress() {
        if (!this.ready || !this.player) return;

        const current = this.player.getCurrentTime() || 0;
        const duration = this.player.getDuration() || 0;

        const percent = duration > 0
            ? (current / duration) * 100
            : 0;

        const progress = document.getElementById(
            "player-progress"
        );

        const currentTime = document.getElementById(
            "player-current-time"
        );

        const durationText = document.getElementById(
            "player-duration"
        );

        if (progress) progress.value = percent;

        if (currentTime) {
            currentTime.textContent = this.formatTime(current);
        }

        if (durationText) {
            durationText.textContent = this.formatTime(duration);
        }
    },

    // Memperbarui tampilan player
    updateUI() {
        const song = this.currentSong;

        const title = document.getElementById("player-title");
        const artist = document.getElementById("player-artist");
        const thumbnail = document.getElementById(
            "player-thumbnail"
        );

        const playButton = document.getElementById(
            "player-play-btn"
        );

        const volumeSlider = document.getElementById(
            "player-volume"
        );

        if (title) {
            title.textContent = song ? song.title : "Belum ada lagu";
        }

        if (artist) {
            artist.textContent = song ? song.artist : "Melodify";
        }

        if (thumbnail && song) {
            thumbnail.src = song.thumbnailUrl ||
                `https://img.youtube.com/vi/${song.youtubeVideoId}/mqdefault.jpg`;

            thumbnail.alt = song.title;
        }

        if (playButton) {
            playButton.textContent = this.playing ? "⏸" : "▶";
            playButton.setAttribute(
                "aria-label",
                this.playing ? "Pause" : "Play"
            );
        }

        if (volumeSlider) {
            volumeSlider.value = this.volume;
        }
    }
};

// Dipanggil otomatis oleh YouTube IFrame API
window.onYouTubeIframeAPIReady = function () {
    MelodifyPlayer.createPlayer();
};

// Inisialisasi setelah HTML siap
document.addEventListener("DOMContentLoaded", () => {
    MelodifyPlayer.init();
});
