/*
 * MELODIFY - ROUTER.JS
 * Navigasi tanpa memuat ulang halaman penuh (PJAX).
 *
 * Pemutar (footer) dan iframe YouTube berada di luar <main class="content">,
 * jadi tidak ikut diganti saat pindah halaman. Dengan begitu lagu terus
 * berjalan dari Beranda -> Lagu -> Playlist -> Detail Playlist.
 *
 * Yang diganti saat pindah halaman: isi <main>, judul, menu utama, dan
 * script milik halaman tujuan (home.js, songs.js, dst.).
 */

(function () {

    // Script bersama: dimuat sekali dan tidak boleh dijalankan ulang
    const SHARED = ["api.js", "player.js", "app.js", "router.js"];

    const baseName = (src) => (src || "").split("?")[0].split("/").pop();

    let navId = 0;          // mencegah navigasi lama menimpa yang baru
    let pageListeners = []; // listener window milik halaman aktif

    function isPageUrl(url) {
        return url.origin === location.origin &&
            (url.pathname.endsWith(".html") || url.pathname === "/");
    }

    // Catat listener "melodify:*" di window yang dipasang script halaman
    // (router dimuat sebelum script halaman), lalu dilepas saat pindah halaman
    // supaya tidak menumpuk.
    const originalAdd = window.addEventListener;

    window.addEventListener = function (type, handler, options) {
        if (typeof type === "string" && type.startsWith("melodify:")) {
            pageListeners.push([type, handler, options]);
        }
        return originalAdd.call(this, type, handler, options);
    };

    function runPageScript(code) {
        const script = document.createElement("script");
        script.textContent = code;
        document.body.appendChild(script);
        script.remove();
    }

    function cleanupPage() {
        pageListeners.forEach(([type, handler, options]) =>
            window.removeEventListener(type, handler, options));
        pageListeners = [];
    }

    async function navigate(href, { push = true } = {}) {

        const url = new URL(href, location.href);
        const id = ++navId;

        try {

            const response = await fetch(url.href, { headers: { Accept: "text/html" } });

            if (!response.ok) throw new Error("HTTP " + response.status);

            const doc = new DOMParser().parseFromString(await response.text(), "text/html");
            const newMain = doc.querySelector("main.content");
            const main = document.querySelector("main.content");

            if (!newMain || !main) throw new Error("Struktur halaman tidak cocok");

            // Skrip halaman tujuan (selain skrip bersama)
            const pageSrcs = [...doc.querySelectorAll("script[src]")]
                .map(s => s.getAttribute("src"))
                .filter(src => !SHARED.includes(baseName(src)));

            const codes = await Promise.all(
                pageSrcs.map(src =>
                    fetch(new URL(src, url).href).then(r => {
                        if (!r.ok) throw new Error("HTTP " + r.status);
                        return r.text();
                    })
                )
            );

            if (id !== navId) return; // sudah ada navigasi yang lebih baru

            cleanupPage();

            if (push) history.pushState({ melodify: true }, "", url.href);

            document.title = doc.title;

            const nav = document.querySelector(".sidebar .nav");
            const newNav = doc.querySelector(".sidebar .nav");
            if (nav && newNav) nav.innerHTML = newNav.innerHTML;

            main.innerHTML = newMain.innerHTML;
            main.scrollTop = 0;

            codes.forEach(runPageScript);

            window.MelodifyUI?.loadSidebarPlaylists();
            window.MelodifyUI?.markPlaying();

        } catch (error) {
            console.error("Navigasi:", error);
            location.href = url.href; // cadangan: muat ulang biasa
        }
    }

    // Klik tautan internal
    document.addEventListener("click", (event) => {

        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const link = event.target.closest("a[href]");

        if (!link || link.target || link.hasAttribute("download")) return;

        const url = new URL(link.href, location.href);

        if (!isPageUrl(url)) return;

        event.preventDefault();

        if (url.href === location.href) return;

        navigate(url.href);
    });

    // Form pencarian (GET ke songs.html)
    document.addEventListener("submit", (event) => {

        const form = event.target;

        if (event.defaultPrevented || !(form instanceof HTMLFormElement)) return;
        if ((form.method || "get").toLowerCase() !== "get") return;

        const url = new URL(form.getAttribute("action") || location.href, location.href);

        if (!isPageUrl(url)) return;

        event.preventDefault();

        url.search = new URLSearchParams(new FormData(form)).toString();
        navigate(url.href);
    });

    // Tombol Kembali / Maju pada browser
    window.addEventListener("popstate", () => navigate(location.href, { push: false }));
})();
