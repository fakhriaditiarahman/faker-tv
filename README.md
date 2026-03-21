# Faker-TV

> **Web-Based Remote Control** untuk Samsung Smart TV (Tizen OS), Xiaomi TV (Android TV) & Infinix TV (Android TV).
> Tidak perlu instal aplikasi — cukup scan QR Code, dan smartphone langsung jadi remote!

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Zero-Install UX** | Scan QR Code dari terminal → remote langsung aktif di browser HP |
| **Multi-Brand** | Mendukung Samsung (Tizen), Xiaomi (Android TV), dan Infinix (Android TV) dalam satu aplikasi |
| **Low-Latency** | Komunikasi via Socket.IO, respon < 50ms seperti remote fisik |
| **Wake-on-LAN** | Hidupkan TV dari mode standby menggunakan Magic Packet |
| **Haptic Feedback** | Getaran di HP saat tombol ditekan untuk pengalaman taktil |
| **State Persistence** | Token pairing disimpan otomatis — tidak perlu pairing ulang |
| **Premium UI** | Antarmuka Glassmorphism & Neumorphic yang modern dan elegan |

---

## System Architecture

```
Smartphone Browser (Client)
         |
         |  Socket.IO (Event-Driven, Full-Duplex)
         v
Node.js Bridge Server
         |
         |  WebSocket (WSS/WS) — Port spesifik per brand
         v
Samsung Smart TV (Tizen) / Xiaomi TV (Android TV) / Infinix TV (Android TV)
```

**Mengapa butuh Bridge Server?**
- Browser **tidak bisa** langsung konek ke TV karena CORS & SSL self-signed TV
- Bridge Server menangani handshake SSL, token pairing, dan WoL UDP yang tidak diizinkan dari browser

---

## Prasyarat

Pastikan hal-hal berikut sudah terpenuhi sebelum memulai:

- **Node.js** v18 atau lebih baru → [Download](https://nodejs.org)
- **npm** v9+ (sudah termasuk saat install Node.js)
- **TV dan komputer/server dalam satu jaringan WiFi yang sama**
- TV dalam keadaan **menyala** dan terhubung ke jaringan lokal

---

## Cara Pakai (Quick Start)

### Langkah 1 — Clone Repositori

```bash
git clone https://github.com/fakhriaditiarahman/faker-tv.git
cd faker-tv
```

---

### Langkah 2 — Cari IP & MAC Address TV

Sebelum konfigurasi, kamu perlu tahu IP dan MAC Address TV kamu.

**Cara mencari IP TV:**
- **Samsung**: Menu → Pengaturan → Umum → Jaringan → Status Jaringan → Info IP
- **Xiaomi**: Pengaturan → Wi-Fi → [Nama WiFi] → Detail Koneksi

**Cara mencari MAC Address TV:**
- **Samsung**: Menu → Pengaturan → Dukungan → Tentang TV → MAC Address
- **Xiaomi**: Pengaturan → Tentang → Status → MAC Address (WLAN)

---

### Langkah 3 — Konfigurasi TV

Buka file `server/tv-config.json` dan sesuaikan dengan data TV kamu:

**Untuk Samsung TV:**
```json
{
  "brand": "samsung",
  "ip": "192.168.1.X",
  "mac": "XX:XX:XX:XX:XX:XX",
  "name": "TV Samsung ku",
  "port": 8002
}
```

**Untuk Xiaomi TV:**
```json
{
  "brand": "xiaomi",
  "ip": "192.168.1.X",
  "mac": "XX:XX:XX:XX:XX:XX",
  "name": "Xiaomi TV ku",
  "port": 64738
}
```

**Untuk Infinix TV:**
```json
{
  "brand": "infinix",
  "ip": "192.168.1.X",
  "mac": "XX:XX:XX:XX:XX:XX",
  "name": "Infinix TV ku",
  "port": 6466
}
```

> **Ganti `192.168.1.X`** dengan IP TV yang kamu temukan di Langkah 2.
> **MAC Address** diperlukan untuk fitur Wake-on-LAN. Jika tidak diisi, fitur WoL tidak aktif.

---

### Langkah 4 — Jalankan Bridge Server

Buka terminal baru (**Terminal 1**), jalankan server:

```bash
cd server
npm install
node index.js
```

Jika berhasil, kamu akan melihat output seperti ini:

```
Bridge Server berjalan di port 3001
Menghubungkan ke TV Samsung/Xiaomi/Infinix di 192.168.1.X...
Terhubung ke TV!
Scan QR Code berikut dengan HP:
```

...diikuti dengan QR Code ASCII di terminal.

---

### Langkah 5 — Jalankan Web Client

Buka terminal baru lagi (**Terminal 2**), jalankan client:

```bash
cd client
npm install
npm run dev -- --host
```

Output akan menampilkan alamat seperti:

```
  Local:   http://localhost:5173/
  Network: http://192.168.1.XX:5173/
```

---

### Langkah 6 — Hubungkan HP ke Remote

Kamu punya **2 cara** untuk mulai mengontrol TV dari HP:

**Cara A — Scan QR Code dari Terminal Server**
1. Lihat QR Code yang muncul di terminal server (Langkah 4)
2. Buka kamera HP → scan QR Code tersebut
3. Browser HP otomatis membuka halaman remote

**Cara B — Buka URL Network Client dari HP**
1. Pastikan HP terhubung ke WiFi yang sama
2. Buka browser HP, masukkan URL `Network` dari terminal client (contoh: `http://192.168.1.XX:5173/`)
3. Halaman remote akan terbuka di browser HP

---

## Cara Menggunakan Remote

Setelah halaman remote terbuka di HP:

1. **Pilih brand TV** (Samsung / Xiaomi) jika diminta
2. Remote akan **terhubung otomatis** ke TV dalam beberapa detik
3. **Untuk Samsung TV pertama kali**: Akan muncul notifikasi di layar TV meminta izin koneksi — pilih **Izinkan/Allow**
4. Gunakan kontrol di layar HP untuk mengoperasikan TV:
   - **D-Pad** (atas/bawah/kiri/kanan/OK) untuk navigasi
   - **Volume** untuk mengatur suara
   - **Power** untuk menyalakan/mematikan TV
   - **Home** / **Back** untuk navigasi menu TV
   - **Netflix / YouTube** untuk buka aplikasi langsung

---

## Troubleshooting

### TV tidak terdeteksi / tidak bisa konek

- Pastikan TV dan komputer/server **berada di jaringan WiFi yang sama**
- Cek ulang IP di `tv-config.json` — IP TV bisa berubah jika menggunakan DHCP
- Coba matikan sementara **firewall** di komputer/server
- Pastikan TV **menyala** (bukan mode standby)

### Samsung: Terus dimintai izin pairing berulang kali

- Ini normal untuk koneksi pertama
- Setelah izin diberikan, token tersimpan di `server/tv-token.txt`
- Jika masalah berlanjut, hapus file `server/tv-token.txt` lalu restart server

### Wake-on-LAN tidak berfungsi

- Pastikan **MAC Address** di `tv-config.json` sudah benar
- Aktifkan fitur WoL di pengaturan TV:
  - **Samsung**: Pengaturan → Umum → Pengaturan Sistem → Network Standby → ON
  - **Xiaomi**: Pengaturan → Preferensi Perangkat → Tetap Terhubung → ON
- WoL bekerja lebih baik via **kabel LAN** dibanding WiFi pada beberapa model TV

### QR Code tidak muncul di terminal

- Pastikan terminal kamu mendukung tampilan karakter UTF-8
- Coba perkecil ukuran font terminal

---

## Struktur Proyek

```
faker-tv/
├── client/                 # Web frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── App.tsx         # Komponen utama remote UI
│   │   └── ...
│   └── package.json
│
├── server/                 # Bridge Server (Node.js)
│   ├── index.js            # Entry point server
│   ├── samsung-adapter.js  # Handler WebSocket Samsung
│   ├── xiaomi-adapter.js   # Handler WebSocket Xiaomi
│   ├── infinix-adapter.js  # Handler WebSocket Infinix
│   ├── tv-config.json      # Konfigurasi TV (edit file ini!)
│   └── package.json
│
└── README.md
```

---

## Referensi Key Codes (Xiaomi TV)

| Tombol | Key Code |
|--------|----------|
| Power | 26 |
| Home | 3 |
| Back | 4 |
| Atas / Bawah / Kiri / Kanan | 19 / 20 / 21 / 22 |
| OK / Enter | 23 |
| Volume + / Volume - | 24 / 25 |
| Mute | 164 |
| Play / Pause | 126 / 127 |
| Netflix / YouTube | 206 / 207 |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, Socket.IO, WebSocket (`ws`) |
| **Networking** | Wake-on-LAN (UDP Magic Packet), QR Code Terminal Generator |
| **Styling** | Neumorphic Design, Glassmorphism Effects |

---

Developed with Precision by **Fakhri Aditia Rahman**

*"This project is an independent development and is not affiliated with, authorized, or endorsed by Samsung Electronics, Xiaomi, or the Tizen Association."*
