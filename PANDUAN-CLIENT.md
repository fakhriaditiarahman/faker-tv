# 📺 Panduan Lengkap Menggunakan Faker-TV Remote

> Web-Based Remote Control untuk Samsung Smart TV (Tizen OS), Xiaomi TV (Android TV), Infinix TV (Android TV) & Sony Android TV.

---

## ✅ Prasyarat

Sebelum memulai, pastikan kamu memiliki:

- **Laptop/PC** untuk menjalankan server
- **Smartphone** dengan browser modern (Chrome/Safari/Firefox)
- **TV** (Samsung/Xiaomi/Infinix/Sony) yang terhubung ke WiFi
- **Jaringan WiFi** yang sama antara laptop dan TV

---

## 🔧 Langkah 1: Clone & Setup Project

### 1.1 Clone Repository

Buka terminal di laptop/PC, lalu jalankan:

```bash
git clone https://github.com/fakhriaditiarahman/faker-tv.git
cd faker-tv
```

### 1.2 Install Dependencies Server

```bash
cd server
npm install
```

### 1.3 Install Dependencies Client

```bash
cd ../client
npm install
```

---

## ⚙️ Langkah 2: Konfigurasi TV Kamu

### 2.1 Cari IP Address TV

**Samsung TV:**
```
Menu → Pengaturan → Umum → Jaringan → Status Jaringan → Info IP
```

**Xiaomi/Sony/Infinix TV:**
```
Pengaturan → Jaringan → Status Jaringan
```

Catat IP Address yang muncul (contoh: `192.168.1.100`)

### 2.2 Cari MAC Address TV

**Samsung TV:**
```
Menu → Pengaturan → Dukungan → Tentang TV → MAC Address
```

**Xiaomi/Sony/Infinix TV:**
```
Pengaturan → Tentang → Status → MAC Address (WLAN)
```

Catat MAC Address yang muncul (contoh: `AA:BB:CC:DD:EE:FF`)

### 2.3 Edit File Konfigurasi

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

**Untuk Sony Android TV:**
```json
{
  "brand": "sony",
  "ip": "192.168.1.X",
  "mac": "XX:XX:XX:XX:XX:XX",
  "name": "Sony Android TV ku",
  "port": 64738
}
```

> ⚠️ **Penting:** Ganti `192.168.1.X` dengan IP TV yang kamu temukan, dan sesuaikan `brand` dengan merek TV kamu.

---

## 🚀 Langkah 3: Jalankan Bridge Server

Buka **Terminal 1** di laptop/PC:

```bash
cd server
npm start
```

Tunggu hingga muncul output seperti ini:

```
Bridge Server berjalan di port 3001
Menghubungkan ke TV Samsung/Xiaomi/Infinix/Sony di 192.168.1.X...
Terhubung ke TV!
Scan QR Code berikut dengan HP:
╭─────────────────────────╮
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓            ▓▓       │
│  ... (QR Code) ...     │
╰─────────────────────────╯
```

> 📌 **Catat:** QR Code ini akan digunakan untuk menghubungkan HP.

---

## 📱 Langkah 4: Jalankan Web Client

Buka **Terminal 2** (terminal baru) di laptop/PC:

```bash
cd client
npm run dev -- --host
```

Tunggu hingga muncul output seperti ini:

```
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.XX:5173/
  ➜  press h + enter to show help
```

> 📌 **Penting:** Catat URL **Network** (contoh: `http://192.168.1.XX:5173/`)

---

## 📲 Langkah 5: Hubungkan HP ke Remote

Kamu punya **2 cara** untuk menghubungkan HP:

### Cara A: Scan QR Code dari Terminal Server

1. Lihat QR Code yang muncul di **Terminal 1** (server)
2. Buka **kamera HP** atau aplikasi QR scanner
3. Scan QR Code tersebut
4. Browser HP akan otomatis membuka halaman remote

### Cara B: Buka URL Network Client Manual

1. Pastikan HP terhubung ke **WiFi yang sama** dengan laptop
2. Buka browser di HP (Chrome/Safari/Firefox)
3. Masukkan URL **Network** dari Terminal 2 (contoh: `http://192.168.1.XX:5173/`)
4. Halaman remote akan terbuka di browser HP

> ⚠️ **Penting:** HP dan laptop **harus** berada di jaringan WiFi yang sama!

---

## 🎮 Langkah 6: Mulai Gunakan Remote

### 6.1 Koneksi Pertama Kali

Setelah halaman remote terbuka di HP:

1. Remote akan **terhubung otomatis** ke TV dalam beberapa detik
2. **Untuk Samsung TV pertama kali:** Akan muncul notifikasi di layar TV meminta izin koneksi
3. Pilih **Izinkan / Allow** di TV
4. Token pairing akan tersimpan otomatis — tidak perlu pairing ulang di kemudian hari

### 6.2 Kontrol yang Tersedia

| Tombol | Fungsi |
|--------|--------|
| **D-Pad** (⬆️⬇️⬅️➡️ OK) | Navigasi menu TV |
| **Volume + / -** | Menaikkan/menurunkan volume |
| **Mute** | Bisukan suara |
| **Power** | Menyalakan/mematikan TV |
| **Home** | Kembali ke home screen TV |
| **Back** | Kembali ke menu sebelumnya |
| **Source** | Ganti input source (HDMI, TV, dll) |
| **Netflix** | Buka aplikasi Netflix |
| **YouTube** | Buka aplikasi YouTube |
| **Play / Pause** | Kontrol pemutaran video |
| **Rewind / FF** | Mundur/maju cepat |

### 6.3 Fitur Khusus

- **Haptic Feedback:** HP akan bergetar saat tombol ditekan (jika didukung browser)
- **Wake-on-LAN:** Nyalakan TV dari mode standby (perlu MAC Address yang benar)
- **Auto Reconnect:** Koneksi otomatis tersambung ulang jika terputus

---

## 🔍 Troubleshooting

### TV Tidak Terdeteksi / Tidak Bisa Konek

| Penyebab | Solusi |
|----------|--------|
| TV dan laptop beda WiFi | Pastikan keduanya di jaringan yang sama |
| IP TV salah | Cek ulang IP di `server/tv-config.json` |
| TV dalam mode standby | Nyalakan TV terlebih dahulu |
| Firewall memblokir | Matikan sementara firewall di laptop |

### Samsung TV Terus Meminta Izin Pairing

| Penyebab | Solusi |
|----------|--------|
| Koneksi pertama | Normal, akan hilang setelah izin diberikan |
| Token corrupt | Hapus file `server/tv-token.txt` lalu restart server |

### Wake-on-LAN Tidak Berfungsi

| Penyebab | Solusi |
|----------|--------|
| MAC Address salah | Pastikan MAC Address di `tv-config.json` benar |
| WoL belum aktif di TV | Aktifkan di pengaturan TV (lihat di bawah) |
| Koneksi WiFi (bukan LAN) | WoL lebih stabil via kabel LAN |

**Cara Aktifkan WoL di TV:**

- **Samsung:** `Pengaturan → Umum → Pengaturan Sistem → Network Standby → ON`
- **Xiaomi:** `Pengaturan → Preferensi Perangkat → Tetap Terhubung → ON`
- **Sony:** `Pengaturan → Jaringan → Network & Internet → Wake on LAN → ON`

### QR Code Tidak Muncul di Terminal

| Penyebab | Solusi |
|----------|--------|
| Terminal tidak support UTF-8 | Gunakan terminal modern (Windows Terminal, iTerm2, dll) |
| Font terminal terlalu besar | Perkecil ukuran font terminal |

### Client Tidak Bisa Konek ke Server

| Penyebab | Solusi |
|----------|--------|
| Port 3001 terblokir | Pastikan port 3001 accessible dari HP |
| Server belum jalan | Jalankan server dulu sebelum client |
| IP/hostname salah | Pastikan URL client sesuai dengan IP server |

---

## 📁 Struktur File Penting

```
Tizen-QR-main/
├── server/
│   ├── index.js              ← Entry point server
│   ├── tv-config.json        ← ⚠️ Edit file ini sesuai TV kamu
│   ├── samsung-adapter.js    ← Handler untuk Samsung TV
│   ├── xiaomi-adapter.js     ← Handler untuk Xiaomi TV
│   ├── infinix-adapter.js    ← Handler untuk Infinix TV
│   ├── sony-adapter.js       ← Handler untuk Sony TV
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── App.tsx           ← UI remote utama
│   │   └── ...
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🎯 Tips Penggunaan

1. **Bookmark URL remote** di browser HP untuk akses cepat di kemudian hari
2. **Tambahkan ke Home Screen** (Add to Home Screen) untuk akses seperti aplikasi native
3. **Gunakan mode landscape** untuk pengalaman remote yang lebih nyaman
4. **Aktifkan auto-rotate** di HP untuk fleksibilitas orientasi

---

## 📞 Referensi Key Codes (Android TV)

Untuk Xiaomi, Infinix, dan Sony Android TV:

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

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Framer Motion |
| **Backend** | Node.js, Express, Socket.IO, WebSocket |
| **Networking** | Wake-on-LAN, QR Code Generator |
| **Supported TV** | Samsung (Tizen), Xiaomi, Infinix, Sony (Android TV) |

---

## 📄 License

MIT License - Faker-TV Project

---

**Developed with Precision by Fakhri Aditia Rahman**

*"This project is an independent development and is not affiliated with, authorized, or endorsed by Samsung Electronics, Xiaomi, or the Tizen Association."*
