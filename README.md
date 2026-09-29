# Mantra Eligible Bot

Bot Discord untuk verifikasi eligibility member komunitas Roblox **MANTRA CREATIVE**
(https://www.roblox.com/id/communities/783602348/MANTRA-CREATIVE) — cek apakah
seorang user sudah bergabung ke grup Roblox minimal **14 hari** (bisa diubah).

### Command `/verifikasi username:<username roblox>`

Hasil ditampilkan dalam embed premium berisi:
- Avatar Roblox (headshot)
- Username & Display Name
- ID Roblox
- Bergabung Sejak & Eligible Pada
- Progress bar
- Judul status: 🟢 Eligible Verification / 🟡 Eligible Unverification / ❌ Belum Terdaftar sebagai Member
- Tombol link ke profil Roblox

Keterangan error dibedakan:
- **Username tidak ditemukan di Roblox** (salah ketik) → embed "🔎 Username Tidak Ditemukan"
- **Username valid tapi belum join grup** → embed "❌ Belum Terdaftar sebagai Member"

### Command `/panel` (khusus staff, butuh permission **Manage Server**)

Memasang panel embed **"🔍 CEK STATUS AKUN"** di channel tempat command dijalankan, dengan 2 tombol:
- **Cek Akun Anda** → buka form (modal) input username Roblox, hasilnya dibalas privat (ephemeral) ke user yang klik
- **Link Komunitas MC** → tombol link langsung ke halaman komunitas Roblox

Panel ini **sticky**: begitu ada pesan baru masuk ke channel tsb, bot otomatis hapus panel lama & kirim ulang di paling bawah, supaya selalu jadi pesan terbaru/paling gampang dilihat. Re-post di-debounce ~1.5 detik supaya tidak spam saat chat lagi ramai.

### Command `/unpanel` (khusus staff, butuh permission **Manage Server**)

Melepas panel sticky dari channel tsb (hapus pesan panel + berhenti auto re-post).

### 🏆 Quiz Arena Leaderboard

Semua command di bawah khusus staff (butuh permission **Manage Server**):

- **`/quiz-menang user:<@user> [poin:<jumlah, default 1>]`** — tambah poin ke user (dipakai tiap ada pemenang quiz baru).
- **`/quiz-kurang user:<@user> [poin:<jumlah, default 1>]`** — kurangi poin (buat koreksi salah input).
- **`/quiz-set user:<@user> poin:<jumlah>`** — set poin user langsung ke nilai tertentu (buat koreksi besar/import data lama).
- **`/quiz-leaderboard`** — pasang panel leaderboard **live** di channel ini (kalau sebelumnya sudah ada di channel lain, otomatis dipindah).

Setiap kali poin berubah (lewat command di atas), bot otomatis:
1. **Edit pesan leaderboard** yang lagi live (kalau sudah dipasang lewat `/quiz-leaderboard`) — jadi selalu real-time tanpa perlu jalanin command lagi.
2. **Sinkron role Top 1/2/3** — role lama dilepas dari user yang posisinya turun/lengser, role baru dipasang ke user yang naik ke Top 1/2/3. Role ID-nya sudah di-set default ke:
   - Top 1: `1553133641587105942`
   - Top 2: `1553133806456930435`
   - Top 3: `1553133866460647485`
   (bisa diganti lewat `QUIZ_ROLE_TOP1` / `QUIZ_ROLE_TOP2` / `QUIZ_ROLE_TOP3` di `.env`)

Tampilan leaderboard: Top 1-3 pakai medali 🥇🥈🥉, lalu **Top 4-10** dan **Top 11-20** masing-masing jadi daftar terpisah, format `<mention username> — X poin`.

> Bot butuh permission **Manage Roles** di server, dan role Top 1/2/3 harus diposisikan **di bawah** role bot di daftar role server (Discord tidak izinkan bot kelola role yang posisinya lebih tinggi dari role bot sendiri).

### 🎉 Server Booster Thank You (otomatis, tanpa command)

Begitu ada member yang **baru mulai** boost server, bot otomatis:
1. Kirim pesan di channel yang di-set lewat `BOOST_CHANNEL_ID`:
   `🎉 Terima kasih! **{nama}** baru saja melakukan Boost pada server!`
2. Sertakan gambar "Thank You" bertema hitam+pink (sesuai logo MANTRA CREATIVE), isinya: avatar Discord booster, label **NEW SERVER BOOSTER**, **THANK YOU!**, username, dan kotak **SERVER BOOSTS** (jumlah boost server saat ini), plus logo & nama server (**MANTRA CREATIVE**) sebagai watermark.

> Fitur ini butuh intent privileged **Server Members Intent** — wajib diaktifkan manual di Discord Developer Portal (langkah 3 di bawah), kalau tidak bot tidak akan bisa mendeteksi event boost sama sekali (bukan error, tapi event-nya memang tidak pernah dikirim Discord ke bot).

### `/boost-sync [force:True/False]` (khusus staff, backfill notif yang kelewat)

Kalau bot sempat offline pas ada boost masuk (jadi notifnya kelewat), jalankan
`/boost-sync` — bot akan cek member yang **statusnya sedang boost sekarang**
tapi belum pernah dikirimi notif, lalu kirim notifnya. Tambahkan `force:True`
untuk kirim ulang ke SEMUA booster yang aktif sekarang, walau sebelumnya
sudah pernah dikirimi (misalnya dipakai sekali setelah desain gambar boost
diperbarui).

> Catatan: karena berbasis status member SAAT INI, boost yang sudah tidak
> aktif lagi (member sudah berhenti boost / Nitro-nya habis) tidak akan
> kedeteksi lagi oleh `/boost-sync` — Discord tidak menyimpan riwayat boost
> yang sudah berakhir.

### 🎵 Music Bot & Voice 24/7

Bot otomatis join ke voice channel yang di-set lewat `MUSIC_VOICE_CHANNEL_ID`
begitu online, dan **tetap nempel di situ 24/7** — walau tidak ada yang
diputar, bot memainkan silent audio filler (bukan file, di-generate langsung
di kode) supaya tidak kena idle-timeout/auto-move ke AFK channel oleh
Discord. Kalau koneksinya putus (network glitch, dsb), bot otomatis coba
reconnect sendiri.

Command untuk semua member:
- **`/play lagu:<link/keyword>`** — putar lagu. Terima 3 bentuk input:
  - Link YouTube (video biasa)
  - Link Spotify (track/album/playlist) — karena Spotify API publik tidak
    bisa streaming full track, judul+artisnya dibaca dari link itu, lalu
    dicari & diputar dari YouTube
  - Kata kunci judul lagu bebas (dicari otomatis di YouTube)

  Kalau ada yang sedang diputar, lagu baru masuk ke antrian.
- **`/skip`** — skip lagu yang sedang diputar, lanjut ke antrian berikutnya.
- **`/pause`** — pause/lanjutkan lagu yang sedang diputar (toggle).
- **`/stop`** — stop & kosongkan antrian (bot tetap di voice channel, cuma balik ke silent filler).
- **`/queue`** — lihat lagu yang sedang diputar + daftar antrian.
- **`/volume persen:<0-200>`** — atur volume (100 = normal).

Command khusus staff (butuh permission **Manage Server**):
- **`/musicjoin`** — suruh bot join ke voice channel kamu sekarang (atau ke channel default di `.env` kalau kamu tidak sedang di voice channel manapun).
- **`/musicpanel`** — pasang **panel kontrol musik premium** (live, auto-update, sticky) di channel ini, isinya:
  - Info lagu yang sedang diputar (judul, thumbnail, durasi) + status pause + daftar antrian
  - Status **Autoplay** (aktif/nonaktif) dan **Volume** saat ini
  - Tombol:
    - **▶️ Play** — buka form buat masukin link/judul lagu langsung dari panel, tanpa perlu ngetik `/play`
    - ⏸️/▶️ (pause/resume), ⏭️ (skip), ⏹️ (stop)
    - **🔁 Autoplay: ON/OFF** — toggle. Kalau ON dan antrian habis, bot otomatis lanjut ke lagu "senada" dari lagu terakhir yang diputar (pakai fitur Mix/Radio YouTube), mirip Autoplay di Spotify/YouTube Music. Kalau OFF, begitu antrian habis bot balik ke silent filler seperti biasa.
  - Tombol volume +/- sengaja dihilangkan dari panel (masih bisa diatur lewat `/volume persen:<0-200>`) supaya tampilan panel lebih ringkas.

  Panel ini **sticky** — persis seperti panel "Cek Status Akun": kalau ada pesan baru masuk di channel yang sama, bot otomatis hapus & kirim ulang panelnya supaya selalu jadi pesan paling bawah/terbaru (ada debounce ~1.5 detik biar tidak spam saat chat ramai). Panel juga otomatis di-refresh (edit in-place, tanpa repost) tiap ada perubahan status — ganti lagu, pause, autoplay, dst — dan otomatis dipasang ulang lagi setiap kali bot restart (lokasinya tersimpan di `data/music-panel.json`). Kalau `MUSIC_PANEL_CHANNEL_ID` di `.env` diisi, bot juga otomatis PASANG panel itu sendiri di channel tsb kalau belum pernah dipasang sama sekali.

> **Wajib install 2 tool ini di server:**
> - **ffmpeg** (`sudo apt install -y ffmpeg` di Ubuntu/Debian) — decode/transcode audio jadi format yang Discord voice terima.
> - **yt-dlp** — yang beneran ambil audio dari YouTube. Install versi terbaru langsung dari GitHub release (lebih stabil daripada versi di apt yang sering ketinggalan update):
>   ```bash
>   sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
>   sudo chmod a+rx /usr/local/bin/yt-dlp
>   yt-dlp --version   # pastikan muncul versi, bukan error
>   ```
>   YouTube sering ubah mekanisme internalnya, jadi kalau `/play` mulai gagal lagi di kemudian hari, coba update dulu: `sudo yt-dlp -U` (atau ulangi command install di atas buat ambil release terbaru).
>
> Tanpa kedua tool ini, `/play` akan gagal generate audio (error muncul di log, bukan silent fail).
>
> Bot butuh permission **Connect** & **Speak** di voice channel target (biasanya sudah termasuk kalau invite link bot sudah punya permission umum di server).

## 1. Persiapan

### a. Bot Discord
1. Buat application + bot di https://discord.com/developers/applications
2. Ambil **Application ID** (`CLIENT_ID`) dan **Bot Token** (`DISCORD_TOKEN`)
3. Di tab **Bot**, di bagian **Privileged Gateway Intents**, **wajib aktifkan "SERVER MEMBERS INTENT"** (dipakai untuk mendeteksi member yang boost server). Tidak perlu **Message Content Intent** karena bot tidak baca isi pesan.
4. Invite bot ke server dengan scope `bot applications.commands`, permission minimal: **Send Messages**, **Embed Links**, **Attach Files** (untuk gambar boost), **Read Message History**, **Use Slash Commands**, **Manage Roles** (untuk fitur Quiz Arena Leaderboard), **Connect** & **Speak** (untuk fitur music/voice 24/7).
5. Di Server Settings → Roles, pastikan role bot diposisikan **di atas** role Top 1/2/3 Quiz Arena (drag posisinya lebih tinggi), supaya bot bisa pasang/lepas role tersebut ke member.
6. Isi `BOOST_CHANNEL_ID` di `.env` dengan ID channel tujuan notifikasi boost (klik kanan channel di Discord dengan Developer Mode aktif → **Copy Channel ID**).
7. Isi `MUSIC_VOICE_CHANNEL_ID` di `.env` dengan ID voice channel yang mau ditempati bot 24/7 (opsional — kosongkan kalau mau kontrol manual lewat `/musicjoin`). Isi juga `MUSIC_PANEL_CHANNEL_ID` kalau mau panel kontrol musiknya otomatis terpasang sendiri di channel tertentu.
8. Install **ffmpeg** & **yt-dlp** di server — wajib untuk fitur music (lihat perintah lengkap di bagian "🎵 Music Bot & Voice 24/7" di atas).

### b. API Key Roblox (Open Cloud)
1. Buka https://create.roblox.com/dashboard/credentials
2. Buat API Key baru, di bagian **Access Permissions** tambahkan:
   - System: **Group** (bukan `legacy group`, itu untuk hal lain seperti audit log/relationship)
   - Scope: **Group Membership** → aktifkan **Read** (`group:read` / list memberships)
   - Group: pilih **MANTRA CREATIVE**, atau isi Group ID `783602348`
3. (Opsional) Batasi IP jika bot dijalankan di VPS dengan IP statis, untuk keamanan tambahan.
4. Salin key-nya ke `ROBLOX_API_KEY`.

> Catatan: field tanggal join (`createTime`) diambil dari endpoint Open Cloud v2
> `GET /cloud/v2/groups/{group_id}/memberships`. Kalau Roblox mengubah nama field
> di response mereka, sesuaikan bagian `getGroupJoinDate()` di `src/roblox.js`
> (kode sudah mencoba beberapa nama field yang umum: `createTime`, `createdTime`,
> `joinTime`).

## 2. Install & Konfigurasi

```bash
cd mantra-eligible-bot
npm install
cp .env.example .env
# lalu isi DISCORD_TOKEN, CLIENT_ID, ROBLOX_API_KEY, dst di .env
```

## 3. Deploy Slash Command

```bash
npm run deploy
```

Isi `GUILD_ID` di `.env` untuk testing (command langsung muncul di 1 server).
Kosongkan untuk deploy global (butuh ~1 jam untuk muncul di semua server).

## 4. Jalankan Bot

```bash
npm start
```

Untuk production di VPS, jalankan dengan pm2 (sesuai stack yang biasa dipakai):

```bash
pm2 start src/index.js --name mantra-eligible-bot
pm2 save
```

## 5. Struktur Project

```
src/
  config.js           -> baca & validasi .env
  roblox.js           -> integrasi Roblox API (resolve username, avatar, join date grup)
  ui.js                -> builder embed hasil verifikasi (eligible/pending/not-member/error)
  panel.js             -> builder embed panel "Cek Status Akun" + tombol + modal
  store.js             -> penyimpanan sticky panel (file JSON di data/sticky-panels.json)
  quiz.js              -> builder embed leaderboard + sinkron role top 1/2/3 + refresh panel live
  quizStore.js         -> penyimpanan poin/role-top/lokasi panel (file JSON di data/quiz.json)
  boostCard.js         -> generate gambar "Thank You" server booster (pakai @napi-rs/canvas)
  music/
    resolve.js          -> resolve query (link YouTube/Spotify/keyword) jadi track YouTube siap-play
    player.js           -> koneksi voice, queue, silent filler 24/7, auto-reconnect (pakai @discordjs/voice)
    panel.js             -> builder embed + tombol panel kontrol musik
    panelStore.js         -> penyimpanan lokasi panel musik (file JSON di data/music-panel.json)
  index.js             -> bot utama, semua handler command/tombol/modal/sticky/boost/music
  deploy-commands.js   -> register slash command ke Discord
data/
  sticky-panels.json   -> dibuat otomatis, jangan di-commit (sudah masuk .gitignore)
  quiz.json            -> dibuat otomatis, jangan di-commit (sudah masuk .gitignore)
  music-panel.json     -> dibuat otomatis, jangan di-commit (sudah masuk .gitignore)
```

## 6. Ubah Aturan Eligibility

Ubah `ELIGIBILITY_DAYS` di `.env` (default `14`).

## 7. Troubleshooting

- **"Gagal Menghubungi Roblox API"** → cek `ROBLOX_API_KEY` masih valid & scope group:read sudah aktif untuk group `783602348`.
- **User selalu dianggap "belum bergabung"** padahal sudah join → kemungkinan nama field tanggal di response Roblox berbeda; cek log server (`console.error`) untuk melihat status code / isi respons, sesuaikan `getGroupJoinDate()`.
- **Slash command tidak muncul** → pastikan sudah `npm run deploy`, dan bot sudah di-invite dengan scope `applications.commands`.
- **Panel tidak sticky / tidak pindah ke bawah** → pastikan bot punya permission **Read Message History** di channel tsb (dipakai untuk fetch pesan panel lama sebelum dihapus).
- **`/panel` atau `/unpanel` bilang butuh Manage Server** → command ini sengaja dibatasi hanya untuk role dengan permission **Manage Server**; atur ulang permission command-nya di Server Settings → Integrations kalau mau staff lain bisa pakai.
- **Role Top 1/2/3 tidak berubah sama sekali** → cek log server, biasanya karena posisi role bot lebih rendah dari role Top 1/2/3 (Discord menolak, error "Missing Permissions"). Naikkan posisi role bot di Server Settings → Roles.
- **Leaderboard tidak ke-update otomatis** → pastikan sudah pernah jalanin `/quiz-leaderboard` minimal sekali; kalau pesan panelnya dihapus manual, jalanin lagi `/quiz-leaderboard` untuk pasang ulang.
- **Notifikasi boost tidak pernah muncul sama sekali** → cek 2 hal: (1) **Server Members Intent** sudah dinyalakan di tab Bot Developer Portal, (2) `BOOST_CHANNEL_ID` di `.env` sudah diisi dan channel-nya bisa diakses bot. Kalau intent belum aktif, Discord memang tidak pernah kirim event boost ke bot — tidak akan ada error di log, cuma sunyi saja.
- **Ada boost yang kelewat notifnya (bot lagi offline, dst)** → jalankan `/boost-sync` untuk backfill ke member yang statusnya sedang boost sekarang tapi belum pernah dikirimi notif. Tambahkan `force:True` kalau mau kirim ulang walau member itu sebelumnya sudah pernah dikirimi.
- **Gambar boost gagal ke-generate / avatar kosong** → cek log server; kalau ada error network dari `boostCard.js`, biasanya karena VPS tidak bisa akses CDN Discord (jarang terjadi). Pesan teks tetap terkirim meski gambar gagal (fallback non-fatal).
- **`/play` gagal / tidak ada suara sama sekali** → cek log server untuk baris `[music]`: (1) pastikan **ffmpeg** sudah terinstall (`ffmpeg -version`), (2) pastikan **yt-dlp** sudah terinstall (`yt-dlp --version`) — kalau muncul `Gagal jalankan yt-dlp` di log, berarti belum terinstall/tidak ketemu di PATH, (3) pastikan bot punya permission **Connect** & **Speak** di voice channel itu.
- **Error "Failed to find any playable formats" atau lagu YouTube tertentu gagal diputar** → biasanya YouTube baru saja ubah mekanisme internalnya. Update yt-dlp ke versi terbaru: `sudo yt-dlp -U` (atau download ulang release terbarunya, lihat perintah install di bagian setup). yt-dlp jauh lebih rutin di-update dibanding library ytdl-core, jadi ini biasanya cukup buat memperbaikinya.
- **Bot tidak auto-join voice channel pas restart** → cek `MUSIC_VOICE_CHANNEL_ID` di `.env` sudah diisi dengan ID voice channel yang benar & bot punya akses ke channel itu; cek log server untuk baris `[music] Gagal auto-join voice channel ...`.
- **Bot keluar sendiri dari voice channel / dianggap idle** → seharusnya tidak terjadi karena ada silent audio filler otomatis; kalau tetap terjadi, cek Server Settings → Overview → **Afk Channel** & **Afk Timeout**, dan cek log server untuk error dari `[music]`.
- **Panel musik tidak update otomatis** → pastikan sudah pernah jalanin `/musicpanel` minimal sekali (atau `MUSIC_PANEL_CHANNEL_ID` sudah diisi); kalau pesan panelnya dihapus manual, jalanin lagi `/musicpanel`.
- **Link Spotify gagal diproses** → `spotify-url-info` mengambil metadata dengan cara scraping halaman Spotify (bukan API resmi), jadi kadang bisa gagal kalau Spotify mengubah struktur halamannya. Kalau ini sering terjadi, gunakan link YouTube atau keyword judul lagu langsung sebagai alternatif.
