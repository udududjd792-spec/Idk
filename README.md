# Hentai Hub untuk Nuvio (18+)

Provider tersedia: **Hentai Hub (All)**, **HentaiMama**, **Hentai.TV**, dan **Hanime**.

## Cara pasang

1. Upload isi folder proyek ini ke repository GitHub publik. `manifest.json` harus berada di root repo dan folder `providers/` ada di sebelahnya.
2. Di Nuvio, buka **Settings → Plugins → Add Repository** lalu tempel URL berikut dengan username dan nama repo milikmu:
   `https://raw.githubusercontent.com/USERNAME/REPO/main/manifest.json`
3. Refresh repository, lalu aktifkan provider. Mulai dari **Hentai Hub (All)** saja agar hasil tidak dobel.
4. Buka pengaturan provider dan isi **TMDB API key / Read Access Token**. Bisa didapatkan dari https://www.themoviedb.org/settings/api.

Jika versi Nuvio yang dipakai tidak menampilkan pengaturan provider, edit `var TMDB_API_KEY = '';` di `src/lib.js`, isi key di antara tanda kutip, lalu jalankan `node build.js`. Setelah itu unggah ulang file hasil build di `providers/` beserta `manifest.json`.

## Cara kerja

Nuvio memanggil `getStreams(tmdbId, mediaType, season, episode)` ketika judul dari katalog Nuvio dibuka. Provider memakai TMDB ID untuk menemukan judul, mencari judul itu pada situs provider, memilih episode, lalu mencoba mengambil URL media langsung. Karena itu judul mesti dikenal TMDB agar alur ini bisa mencari namanya.

Provider hanya mengembalikan URL media langsung berformat `.m3u8` atau `.mp4`; halaman embed/iframe sendiri bukan hasil stream.

## Tes dan build

Dengan Node.js 18 atau lebih baru, dari root proyek:

```sh
node build.js
node test/mock.test.js
```

`providers/*.js` adalah file yang diunduh Nuvio; jika mengubah kode di `src/`, jalankan build lagi dan unggah file hasilnya juga.

## Catatan

- `Hentai Hub (All)` menjalankan ketiga sumber sekaligus. Aktifkan provider individual jika ingin menguji sumber satu per satu.
- Jika hasil kosong, cek API key dulu. Situs sumber juga bisa mengganti domain, struktur HTML, atau proteksi; tes offline hanya memverifikasi alur parser dengan respons contoh, bukan ketersediaan situs live.
- Versi paket: 1.1.0.
