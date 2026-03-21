# Faker-TV: High-Performance Web-Based Samsung & Xiaomi TV Remote

**Faker-TV** adalah solusi remote control berbasis web yang dirancang untuk Samsung Smart TV (Tizen OS) dan Xiaomi TV (Android TV/PatchWall). Proyek ini mengeliminasi hambatan instalasi aplikasi tradisional dengan memanfaatkan QR-based pairing dan Bridge Server Architecture untuk komunikasi low-latency melalui protokol WebSocket.

---

## Fitur Utama

- **Multi-Brand Support**: Mendukung Samsung TV (Tizen) dan Xiaomi TV (Android TV)
- **Zero-Install UX**: Cukup scan QR code dari terminal server, dan remote langsung aktif di browser smartphone tanpa perlu mengunduh aplikasi
- **Full Control Suite**: Navigasi D-Pad, Volume Control, Channel Switching, Home, Return, hingga App Shortcuts (Netflix/YouTube)
- **Wake-on-LAN (WoL)**: Menghidupkan TV dari mode standby menggunakan Magic Packet melalui alamat MAC TV
- **Haptic Feedback Engine**: Memberikan sensasi taktil (getaran) saat tombol ditekan menggunakan browser Haptic API
- **State Persistence**: Otomatis menyimpan dan menggunakan kembali pairing token untuk koneksi instan di masa mendatang
- **Premium Neumorphic UI**: Antarmuka modern dengan gaya Glassmorphism dan Neumorphism yang elegan
- **Unit Testing**: Dilengkapi dengan 60+ test cases menggunakan Jest untuk memastikan kualitas dan stabilitas kode

---

## System Architecture

Salah satu aspek teknis paling krusial dalam proyek ini adalah penggunaan Node.js Bridge Server. Arsitektur ini dipilih untuk mengatasi batasan keamanan pada browser modern (CORS & Mixed Content).

```
Smartphone Browser (Client)
       |
       | [Socket.IO / Event-Driven]
       v
Node.js Bridge Server (The Bridge)
       |
       | [WebSocket (WSS/WS) / Brand-Specific Ports]
       v
Samsung Smart TV (Tizen OS) / Xiaomi TV (Android TV)
```

### Mengapa Arsitektur Bridge?

1. **Bypassing SSL/CORS**: Browser smartphone melarang koneksi WebSocket langsung ke IP lokal TV yang menggunakan sertifikat self-signed. Bridge server menangani jabat tangan SSL secara server-side.
2. **Persistent Identification**: Server menggunakan FIXED_ID permanen agar TV mengenali perangkat sebagai remote yang sama, mencegah munculnya notifikasi pairing berulang kali.
3. **Network Discovery & WoL**: Memungkinkan server untuk mengirimkan paket UDP (WoL) yang tidak diizinkan langsung dari browser web smartphone.
4. **Multi-Brand Adapter**: Server menggunakan pattern adapter untuk mendukung berbagai protokol TV (Samsung vs Xiaomi) dengan interface yang sama.

---

## Technical Challenges & Solutions

### 1. Bypassing SSL & Token Pairing (Samsung)
Samsung Smart TV (2016+) menggunakan port 8002 (WSS) dengan protokol keamanan yang ketat.
- **Solusi**: Implementasi manual WebSocket menggunakan library ws di Node.js dengan flag rejectUnauthorized: false. Server menangkap event ms.channel.connect, mengekstrak token otentikasi, dan menyimpannya secara lokal untuk sesi berikutnya.

### 2. Wake-on-LAN Implementation
Saat TV dalam mode standby, port LAN/Wi-Fi seringkali mati total, menyebabkan error EHOSTUNREACH.
- **Solusi**: Integrasi library wake_on_lan untuk menembak Magic Packet ke MAC Address TV sesaat sebelum perintah KEY_POWER dikirimkan, memastikan TV "bangun" dan siap menerima koneksi WebSocket.

### 3. Low-Latency Interaction
Remote control membutuhkan respon instan agar terasa seperti remote fisik.
- **Solusi**: Menggunakan Socket.IO untuk jalur komunikasi dua arah (full-duplex) antara smartphone dan server, memastikan perintah diteruskan ke TV dalam waktu kurang dari 50ms.

### 4. Multi-Brand Protocol Support
Setiap brand TV menggunakan protokol dan port yang berbeda.
- **Samsung TV**: Port 8002 (WSS), WebSocket path /api/v2/channels/samsung.remote.control, token-based auth
- **Xiaomi TV**: Port 64738 (WS), Android TV key codes, HTTP API backup

- **Solusi**: Implementasi Adapter Pattern dengan interface unified untuk kedua brand, memungkinkan penambahan brand baru di masa depan dengan mudah.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | React 19, TypeScript, Vite, TailwindCSS, Lucide Icons, Framer Motion |
| Backend | Node.js, Express, Socket.IO, WebSocket (ws) |
| Networking | Wake-on-LAN (UDP), QR-Code Terminal Generator |
| Testing | Jest (60+ test cases) |
| Styling | Neumorphic Design, Glassmorphism Effects |

---

## Installation & Setup

### 1. Clone & Install
```bash
git clone https://github.com/MAliffadlan/Tizen-QR.git
cd Faker-TV
```

### 2. Configure TV Identity

#### For Samsung TV:
Buka `server/tv-config.json` dan sesuaikan:
```json
{
  "brand": "samsung",
  "ip": "192.168.1.x",
  "mac": "XX:XX:XX:XX:XX",
  "name": "[TV] Samsung 7 Series",
  "port": 8002
}
```

#### For Xiaomi TV:
Buka `server/tv-config.json` dan sesuaikan:
```json
{
  "brand": "xiaomi",
  "ip": "192.168.1.x",
  "mac": "XX:XX:XX:XX:XX",
  "name": "Xiaomi TV",
  "port": 64738
}
```

> **Note**: MAC Address digunakan untuk fitur Wake-on-LAN. Jika tidak tersedia, fitur WoL tidak akan aktif.

### 3. Run the Project

**Terminal 1 (Server Bridge):**
```bash
cd server && npm install && node index.js
```

**Terminal 2 (Web Client):**
```bash
cd client && npm install && npm run dev -- --host
```

### 4. Run Tests (Optional)
```bash
cd server && npm test
```

---

## Supported TV Brands

### Samsung (Tizen OS)
- **Port**: 8002 (WSS), fallback ke 8001 (WS)
- **Authentication**: Token-based (auto-saved)
- **Key Features**: Full remote control, text input, mouse control
- **WoL**: Supported

### Xiaomi (Android TV / PatchWall)
- **Port**: 64738 (WebSocket), 8081 (HTTP API)
- **Authentication**: PIN pairing (model tertentu)
- **Key Features**: Full remote control, text input, mouse control
- **WoL**: Supported
- **Key Codes**: Menggunakan Android TV standard key codes

---

## Troubleshooting

### TV Tidak Terdeteksi
1. Pastikan TV dan server berada di jaringan WiFi yang sama
2. Cek IP TV di pengaturan network TV
3. Gunakan fitur "Force Scan" dari remote UI

### Koneksi Terputus
1. Restart server bridge
2. Hapus file `tv-token.txt` (Samsung) untuk reset pairing
3. Pastikan TV dalam keadaan ON

### Wake-on-LAN Tidak Berfungsi
1. Pastikan MAC Address benar di `tv-config.json`
2. Aktifkan WoL di pengaturan TV
3. Beberapa model TV memerlukan WoL via kabel LAN

---

## Key Codes Reference (Xiaomi TV)

| Command | Key Code |
|---------|----------|
| Power | 26 |
| Home | 3 |
| Back | 4 |
| Up/Down/Left/Right | 19/20/21/22 |
| OK | 23 |
| Volume Up/Down | 24/25 |
| Mute | 164 |
| Play/Pause | 126/127 |
| Netflix/YouTube | 206/207 |

---

## Testing

Proyek ini dilengkapi dengan unit testing dan integration testing menggunakan Jest:

```bash
# Run semua test
cd server && npm test

# Run test dengan watch mode
npm run test:watch

# Run test dengan coverage report
npm test -- --coverage
```

### Test Coverage
- **Samsung Adapter**: 17 test cases
- **Xiaomi Adapter**: 28 test cases
- **Integration Tests**: 15 test cases
- **Total**: 60 test cases (all passing)

---

Developed with Precision & Determination by Faker

"This project is an independent development and is not affiliated with, authorized, or endorsed by Samsung Electronics, Xiaomi, or the Tizen Association."
# faker-tv
