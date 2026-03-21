const WebSocket = require('ws');
const wol = require('wake_on_lan');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, 'tv-token.txt');
const REMOTE_NAME = 'Alif_Remote_Super';
const FIXED_ID = 'alif_super_id_001';

class SamsungAdapter {
    constructor(io) {
        this.io = io;
        this.tvWs = null;
        this.currentPort = 8002;
        this.tvConfig = { ip: null, mac: null, name: 'Samsung TV' };
    }

    setConfig(config) {
        this.tvConfig = config;
    }

    getConfig() {
        return this.tvConfig;
    }

    getSavedToken() {
        if (fs.existsSync(TOKEN_FILE)) return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
        return '';
    }

    connect(port = 8002) {
        if (!this.tvConfig.ip) {
            console.log('IP TV belum diset.');
            return;
        }

        if (this.tvWs && this.tvWs.readyState === WebSocket.OPEN) return;

        this.currentPort = port;
        const token = this.getSavedToken();
        const encodedName = Buffer.from(REMOTE_NAME).toString('base64');

        const protocol = port === 8002 ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${this.tvConfig.ip}:${port}/api/v2/channels/samsung.remote.control?name=${encodedName}${token ? `&token=${token}` : ''}&id=${FIXED_ID}`;

        console.log(`\n--- MENCOBA KONEKSI KE SAMSUNG TV (${this.tvConfig.ip}:${port}) ---`);
        this.io.emit('tv-status', `Menghubungkan ke ${this.tvConfig.name}...`);

        this.tvWs = new WebSocket(wsUrl, {
            rejectUnauthorized: false,
            handshakeTimeout: 5000
        });

        this.tvWs.on('open', () => {
            console.log(`Handshake WebSocket Terbuka di Port ${port}!`);
            this.io.emit('tv-status', `Terhubung ke ${this.tvConfig.name}`);
        });

        this.tvWs.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.event === 'ms.channel.connect') {
                const newToken = msg.data.token;
                if (newToken && newToken !== this.getSavedToken()) {
                    console.log('>>> TOKEN PERMANEN DIDAPAT:', newToken);
                    fs.writeFileSync(TOKEN_FILE, newToken);
                }
            }
        });

        this.tvWs.on('close', () => {
            console.log(`Koneksi ke ${this.tvConfig.ip}:${port} terputus.`);
            this.io.emit('tv-status', 'Koneksi terputus');
        });

        this.tvWs.on('error', (err) => {
            console.error(`Gagal konek ke ${this.tvConfig.ip}:${port}:`, err.message);
            if (port === 8002 && err.message.includes('ECONNREFUSED')) {
                console.log('Mencoba fallback ke Port 8001...');
                setTimeout(() => this.connect(8001), 2000);
            } else {
                this.io.emit('tv-status', 'Gagal terhubung ke TV');
            }
        });

        return this.tvWs;
    }

    isConnected() {
        return !!(this.tvWs && this.tvWs.readyState === WebSocket.OPEN);
    }

    sendKey(key) {
        if (key === 'KEY_POWER' && this.tvConfig.mac) {
            console.log(`--- MENGIRIM MAGIC PACKET (WAKE-ON-LAN) KE ${this.tvConfig.mac} ---`);
            wol.wake(this.tvConfig.mac, (err) => {
                if (!err) console.log('Magic Packet terkirim ke ' + this.tvConfig.mac);
            });
        }

        if (!this.isConnected()) {
            console.log('Koneksi belum siap, mencoba menyambung kembali...');
            if (this.tvConfig.ip) {
                this.connect(this.currentPort);
            }

            setTimeout(() => {
                if (this.isConnected()) {
                    this.doSendKey(key);
                } else {
                    console.log('TV masih belum siap, coba pencet lagi sebentar lagi bos.');
                }
            }, 3000);
            return;
        }

        this.doSendKey(key);
    }

    doSendKey(key) {
        const payload = {
            method: 'ms.remote.control',
            params: {
                Cmd: 'Click',
                DataOfCmd: key,
                Option: 'false',
                TypeOfRemote: 'SendRemoteKey'
            }
        };
        console.log(`Menembak: ${key}`);
        this.tvWs.send(JSON.stringify(payload));
    }

    sendText(text) {
        if (!this.isConnected()) {
            console.log('Koneksi belum siap untuk kirim teks.');
            return;
        }

        console.log(`Mengetik ke TV: "${text}"`);

        const encodedText = Buffer.from(text).toString('base64');
        const payload = {
            method: 'ms.remote.control',
            params: {
                Cmd: encodedText,
                DataOfCmd: 'base64',
                TypeOfRemote: 'SendInputString'
            }
        };
        this.tvWs.send(JSON.stringify(payload));
    }

    sendMouseMove(dx, dy) {
        if (!this.isConnected()) return;

        const payload = {
            method: 'ms.remote.control',
            params: {
                Cmd: 'Move',
                Position: {
                    x: Math.round(dx),
                    y: Math.round(dy),
                    Time: String(Date.now())
                },
                TypeOfRemote: 'ProcessMouseDevice'
            }
        };
        this.tvWs.send(JSON.stringify(payload));
    }

    sendMouseClick() {
        if (!this.isConnected()) return;

        const payload = {
            method: 'ms.remote.control',
            params: {
                Cmd: 'LeftClick',
                TypeOfRemote: 'ProcessMouseDevice'
            }
        };
        console.log('Mouse: LeftClick');
        this.tvWs.send(JSON.stringify(payload));
    }

    getBrand() {
        return 'samsung';
    }
}

module.exports = SamsungAdapter;
