# Mantra Eligible Bot

Bot Discord untuk verifikasi eligibility member komunitas Roblox **MANTRA CREATIVE**
(https://www.roblox.com/id/communities/783602348/MANTRA-CREATIVE) — cek apakah
seorang user sudah bergabung ke grup Roblox minimal **14 hari** (bisa diubah).

Command: `/verifikasi username:<username roblox>`

Hasil ditampilkan dalam embed premium berisi:
- Avatar Roblox (headshot)
- Username & Display Name
- ID Roblox
- Bergabung Sejak (+ berapa hari lalu)
- Status: ✅ Eligible / ⏳ Belum Eligible
- Progress bar & **Eligible Pada** (khusus yang masih belum eligible)
- Tombol link ke profil Roblox

## 1. Persiapan

### a. Bot Discord
1. Buat application + bot di https://discord.com/developers/applications
2. Ambil **Application ID** (`CLIENT_ID`) dan **Bot Token** (`DISCORD_TOKEN`)
3. Invite bot ke server dengan scope `bot applications.commands`, permission minimal: **Send Messages**, **Embed Links**, **Use Slash Commands**.

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
  ui.js                -> builder embed premium + progress bar
  index.js             -> bot utama, handler slash command /verifikasi
  deploy-commands.js   -> register slash command ke Discord
```

## 6. Ubah Aturan Eligibility

Ubah `ELIGIBILITY_DAYS` di `.env` (default `14`).

## 7. Troubleshooting

- **"Gagal Menghubungi Roblox API"** → cek `ROBLOX_API_KEY` masih valid & scope group:read sudah aktif untuk group `783602348`.
- **User selalu dianggap "belum bergabung"** padahal sudah join → kemungkinan nama field tanggal di response Roblox berbeda; cek log server (`console.error`) untuk melihat status code / isi respons, sesuaikan `getGroupJoinDate()`.
- **Slash command tidak muncul** → pastikan sudah `npm run deploy`, dan bot sudah di-invite dengan scope `applications.commands`.
