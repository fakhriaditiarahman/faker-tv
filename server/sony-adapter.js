const WebSocket = require('ws');
const http = require('http');
const wol = require('wake_on_lan');

// Android TV Key Codes (used by Sony Android TV)
const KEY_CODES = {
    // Power & Basic
    'KEY_POWER': 26,
    'KEY_HOME': 3,
    'KEY_BACK': 4,
    'KEY_ENTER': 23,

    // Volume
    'KEY_VOLUP': 24,
    'KEY_VOLDOWN': 25,
    'KEY_MUTE': 164,

    // Navigation (D-Pad)
    'KEY_UP': 19,
    'KEY_DOWN': 20,
    'KEY_LEFT': 21,
    'KEY_RIGHT': 22,

    // Channel
    'KEY_CHUP': 19,
    'KEY_CHDOWN': 20,

    // Media Controls
    'KEY_PLAY': 126,
    'KEY_PAUSE': 127,
    'KEY_REWIND': 89,
    'KEY_FF': 90,

    // Special Functions
    'KEY_MENU': 82,
    'KEY_SETTINGS': 176,
    'KEY_GUIDE': 173,
    'KEY_INFO': 165,
    'KEY_RETURN': 4,
    'KEY_EXIT': 178,

    // Numbers
    'KEY_0': 7,
    'KEY_1': 8,
    'KEY_2': 9,
    'KEY_3': 10,
    'KEY_4': 11,
    'KEY_5': 12,
    'KEY_6': 13,
    'KEY_7': 14,
    'KEY_8': 15,
    'KEY_9': 16,

    // Color Buttons
    'KEY_RED': 188,
    'KEY_GREEN': 189,
    'KEY_YELLOW': 190,
    'KEY_BLUE': 191,

    // App Shortcuts
    'KEY_NETFLIX': 206,
    'KEY_YOUTUBE': 207,

    // Source
    'KEY_SOURCE': 179,
    'KEY_HDMI': 179,

    // Voice/Mic
    'KEY_AMBIENT': 201,
    'KEY_VOICE': 201,

    // TTX/Mix
    'KEY_TTX_MIX': 88,
    'KEY_PRECH': 177,
};

class SonyAdapter {
    constructor(io) {
        this.io = io;
        this.tvWs = null;
        this.httpPort = 8081;
        this.wsPort = 64738;
        this.tvConfig = { ip: null, mac: null, name: 'Sony Android TV' };
    }

    setConfig(config) {
        this.tvConfig = config;
        if (config.port) {
            this.wsPort = config.port;
        }
    }

    getConfig() {
        return this.tvConfig;
    }

    connect(port = 64738) {
        if (!this.tvConfig.ip) {
            console.log('IP TV belum diset.');
            return;
        }

        if (this.tvWs && this.tvWs.readyState === WebSocket.OPEN) return;

        this.wsPort = port;
        const wsUrl = `ws://${this.tvConfig.ip}:${port}`;

        console.log(`\n--- MENCOBA KONEKSI KE SONY ANDROID TV (${this.tvConfig.ip}:${port}) ---`);
        this.io.emit('tv-status', `Menghubungkan ke ${this.tvConfig.name}...`);

        try {
            this.tvWs = new WebSocket(wsUrl, {
                handshakeTimeout: 5000,
                headers: {
                    'Connection': 'Upgrade',
                    'Upgrade': 'websocket'
                }
            });

            this.tvWs.on('open', () => {
                console.log(`WebSocket Sony Android TV Terbuka di Port ${port}!`);
                this.io.emit('tv-status', `Terhubung ke ${this.tvConfig.name}`);
            });

            this.tvWs.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    console.log('Sony Android TV Response:', msg);

                    if (msg.action === 'pairing_response') {
                        console.log('Pairing response received:', msg);
                    }
                } catch (e) {
                    console.log('Raw message from TV:', data.toString());
                }
            });

            this.tvWs.on('close', () => {
                console.log(`Koneksi ke ${this.tvConfig.ip}:${port} terputus.`);
                this.io.emit('tv-status', 'Koneksi terputus');
            });

            this.tvWs.on('error', (err) => {
                console.error(`Gagal konek ke ${this.tvConfig.ip}:${port}:`, err.message);
                // Fallback to port 6466 (alternative Android TV WebSocket port)
                if (port === 64738 && err.message.includes('ECONNREFUSED')) {
                    console.log('Mencoba fallback ke Port 6466...');
                    setTimeout(() => this.connect(6466), 2000);
                } else {
                    this.io.emit('tv-status', `Gagal terhubung ke ${this.tvConfig.name}`);
                }
            });
        } catch (err) {
            console.error('WebSocket connection error:', err.message);
            this.io.emit('tv-status', 'Gagal membuat koneksi WebSocket');
        }

        return this.tvWs;
    }

    isConnected() {
        return !!(this.tvWs && this.tvWs.readyState === WebSocket.OPEN);
    }

    sendKey(key) {
        const keycode = KEY_CODES[key] || KEY_CODES['KEY_ENTER'];

        if (key === 'KEY_POWER' && this.tvConfig.mac) {
            console.log(`--- MENGIRIM MAGIC PACKET (WAKE-ON-LAN) KE ${this.tvConfig.mac} ---`);
            wol.wake(this.tvConfig.mac, (err) => {
                if (!err) console.log('Magic Packet terkirim ke ' + this.tvConfig.mac);
            });
        }

        if (!this.isConnected()) {
            console.log('Koneksi belum siap, mencoba menyambung kembali...');
            if (this.tvConfig.ip) {
                this.connect(this.wsPort);
            }

            setTimeout(() => {
                if (this.isConnected()) {
                    this.doSendKey(keycode);
                } else {
                    console.log('Sony Android TV masih belum siap, coba pencet lagi sebentar lagi bos.');
                }
            }, 3000);
            return;
        }

        this.doSendKey(keycode);
    }

    doSendKey(keycode) {
        const payload = {
            action: 'key_event',
            keycode: keycode,
            actionId: Date.now()
        };
        console.log(`Menembak: keycode ${keycode}`);
        this.tvWs.send(JSON.stringify(payload));
    }

    sendText(text) {
        if (!this.isConnected()) {
            console.log('Koneksi belum siap untuk kirim teks.');
            return;
        }

        console.log(`Mengetik ke TV: "${text}"`);

        const payload = {
            action: 'input_text',
            text: text,
            actionId: Date.now()
        };

        // Try WebSocket first
        this.tvWs.send(JSON.stringify(payload));

        // Also try HTTP endpoint as backup
        this.sendHttpCommand('/controller/sysAction', {
            action: 'inputText',
            params: { text: text }
        });
    }

    sendMouseMove(dx, dy) {
        if (!this.isConnected()) return;

        const payload = {
            action: 'mouse_move',
            dx: Math.round(dx),
            dy: Math.round(dy),
            actionId: Date.now()
        };
        this.tvWs.send(JSON.stringify(payload));
    }

    sendMouseClick() {
        if (!this.isConnected()) return;

        const payload = {
            action: 'mouse_click',
            button: 'left',
            actionId: Date.now()
        };
        console.log('Mouse: LeftClick');
        this.tvWs.send(JSON.stringify(payload));
    }

    sendHttpCommand(endpoint, data) {
        if (!this.tvConfig.ip) return;

        const options = {
            hostname: this.tvConfig.ip,
            port: this.httpPort,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                console.log(`HTTP Response from ${endpoint}:`, responseData);
            });
        });

        req.on('error', (e) => {
            console.error(`HTTP Error to ${endpoint}:`, e.message);
        });

        req.write(JSON.stringify(data));
        req.end();
    }

    getBrand() {
        return 'sony';
    }
}

module.exports = SonyAdapter;
