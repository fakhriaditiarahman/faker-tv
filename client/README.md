# Faker-TV Client

Remote control web client untuk Faker-TV - aplikasi remote control berbasis web untuk Samsung, Xiaomi, dan Infinix TV.

## Fitur

- **Neumorphic UI**: Desain modern dengan efek glassmorphism yang elegan
- **Responsive**: Dioptimalkan untuk perangkat mobile
- **Haptic Feedback**: Getaran saat tombol ditekan (browser Haptic API)
- **Full Remote Control**: D-Pad, Volume, Channel, Navigation, Media Controls
- **Text Input**: Keyboard virtual dengan mode Instant (YouTube) dan Bulk (Browser)
- **Touchpad Mode**: Mouse control dengan gesture support
- **Real-time Connection**: Socket.IO untuk komunikasi low-latency dengan server
- **Auto Reconnect**: Koneksi otomatis ke server bridge

## Tech Stack

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| React | 19 | UI Framework |
| TypeScript | 5.9 | Type Safety |
| Vite | 8 | Build Tool & Dev Server |
| TailwindCSS | 4 | Styling |
| Framer Motion | 12 | Animations |
| Socket.IO Client | 4 | Real-time Communication |

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev -- --host

# Build for production
npm run build

# Preview production build
npm run preview
```

## Remote Controls

### Basic Controls
- **Power**: Turn TV on/off (with WoL support)
- **Source**: Change input source
- **Mic/Voice**: Voice command (if supported)

### Number Pad
- Numbers 0-9 for channel selection
- Previous channel button
- TTX/Mix for teletext

### Volume & Channel Rockers
- Volume Up/Down
- Channel Up/Down
- Mute

### D-Pad Navigation
- Up/Down/Left/Right navigation
- OK/Enter button
- Color buttons (Red, Green, Yellow, Blue)

### Media Controls
- Rewind
- Play
- Pause
- Fast Forward

### App Shortcuts
- Netflix
- YouTube

### Special Features
- **Keyboard**: Virtual keyboard for text input
- **Touchpad**: Mouse control mode
- **Force Scan**: Re-scan network for TV
- **Settings**: TV settings menu

## Connection

Client terhubung ke Faker-TV Bridge Server via Socket.IO:

```typescript
const serverUrl = `http://${window.location.hostname}:3001`;
socket = io(serverUrl);
```

### Status Indicators
- Connected: Terhubung ke TV
- Scanning: Sedang melacak TV
- Disconnected: Terputus dari server
- Error: Gagal terhubung

## UI Components

### RemoteButton
Component tombol dengan animasi spring dan haptic feedback:

```tsx
<RemoteButton onClick={() => sendKey('KEY_VOLUMEUP')}>
  <ChevronUp size={24} />
</RemoteButton>
```

### Rocker Controls
Tombol rocker untuk volume dan channel dengan desain compact.

### D-Pad
Directional pad dengan ring dan tombol OK di tengah.

### Overlays
- **Keyboard Modal**: Untuk text input
- **Touchpad Overlay**: Untuk mouse control

## Mobile Optimization

- Touch-friendly button sizes
- Haptic feedback on button press
- Responsive layout untuk berbagai ukuran layar
- Neumorphic design yang modern

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Network Requirements

- Client dan Server harus berada di jaringan yang sama
- Port 3001 (Server) harus accessible dari client
- Port 5173 (Vite dev server) untuk development

## Configuration

Client secara otomatis terhubung ke server berdasarkan hostname:

```typescript
const serverUrl = `http://${window.location.hostname}:3001`;
```

Untuk production, sesuaikan dengan IP/URL server Anda.

## License

MIT License - Faker-TV Project

---

Faker-TV Client - Part of Faker-TV Remote Control System
