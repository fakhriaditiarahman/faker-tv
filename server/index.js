const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const qrcode = require('qrcode');
const { internalIpV4 } = require('internal-ip');
const fs = require('fs');
const path = require('path');

const SamsungAdapter = require('./samsung-adapter');
const XiaomiAdapter = require('./xiaomi-adapter');
const InfinixAdapter = require('./infinix-adapter');
const SonyAdapter = require('./sony-adapter');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 3001;
const CONFIG_FILE = path.join(__dirname, 'tv-config.json');

// TV Adapter State
let tvAdapter = null;
let currentBrand = null;

// --- Config Management ---
function loadTvConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            const config = JSON.parse(data);
            console.log(`Loaded TV Config: ${config.name} (${config.ip}) - Brand: ${config.brand || 'samsung'}`);
            return config;
        } catch (e) {
            console.error('Failed to parse tv-config.json', e);
        }
    }
    return null;
}

function saveTvConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(`TV Config saved: ${config.name} (${config.ip}) - Brand: ${config.brand}`);
}

function initAdapter(config) {
    const brand = config.brand || 'samsung';

    if (brand === 'xiaomi') {
        tvAdapter = new XiaomiAdapter(io);
        currentBrand = 'xiaomi';
    } else if (brand === 'infinix') {
        tvAdapter = new InfinixAdapter(io);
        currentBrand = 'infinix';
    } else if (brand === 'sony') {
        tvAdapter = new SonyAdapter(io);
        currentBrand = 'sony';
    } else {
        tvAdapter = new SamsungAdapter(io);
        currentBrand = 'samsung';
    }

    tvAdapter.setConfig(config);
    console.log(`Initialized ${brand.toUpperCase()} adapter`);
    return tvAdapter;
}

// --- Auto Discovery ---
async function scanForTv() {
    console.log('\n🔍 Memulai pelacakan TV (Samsung, Xiaomi, Infinix & Sony) di jaringan...');
    io.emit('tv-status', 'Sedang melacak TV di jaringan...');

    const ip = await internalIpV4();
    if (!ip) {
        console.log('Tidak dapat mendeteksi IP lokal.');
        return null;
    }

    const baseIp = ip.split('.').slice(0, 3).join('.');
    const promises = [];

    // Scan for Samsung TV (port 8001)
    for (let i = 1; i < 255; i++) {
        const targetIp = `${baseIp}.${i}`;
        const p = new Promise(resolve => {
            const req = http.get(`http://${targetIp}:8001/api/v2/`, { timeout: 2000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const info = JSON.parse(data);
                        if (info && info.device && info.device.type === 'Samsung SmartTV') {
                            resolve({
                                ip: targetIp,
                                mac: info.device.wifiMac || info.device.mac,
                                name: info.device.name,
                                brand: 'samsung'
                            });
                        } else {
                            resolve(null);
                        }
                    } catch (e) { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
        });
        promises.push(p);
    }

    // Scan for Xiaomi TV (port 8081)
    for (let i = 1; i < 255; i++) {
        const targetIp = `${baseIp}.${i}`;
        const p = new Promise(resolve => {
            const req = http.get(`http://${targetIp}:8081/status`, { timeout: 2000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const info = JSON.parse(data);
                        if (info && (info.device_type || info.model || info.brand === 'Xiaomi')) {
                            resolve({
                                ip: targetIp,
                                mac: info.mac || null,
                                name: info.name || 'Xiaomi TV',
                                brand: 'xiaomi'
                            });
                        } else {
                            resolve(null);
                        }
                    } catch (e) { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
        });
        promises.push(p);
    }

    // Scan for Infinix TV (port 6466)
    for (let i = 1; i < 255; i++) {
        const targetIp = `${baseIp}.${i}`;
        const p = new Promise(resolve => {
            const req = http.get(`http://${targetIp}:6466/`, { timeout: 2000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const info = JSON.parse(data);
                        if (info && (info.brand === 'Infinix' || info.device_type || info.model)) {
                            resolve({
                                ip: targetIp,
                                mac: info.mac || null,
                                name: info.name || 'Infinix TV',
                                brand: 'infinix'
                            });
                        } else {
                            resolve(null);
                        }
                    } catch (e) { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
        });
        promises.push(p);
    }

    // Scan for Sony Android TV (port 8081)
    for (let i = 1; i < 255; i++) {
        const targetIp = `${baseIp}.${i}`;
        const p = new Promise(resolve => {
            const req = http.get(`http://${targetIp}:8081/status`, { timeout: 2000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const info = JSON.parse(data);
                        if (info && (info.brand === 'Sony' || info.device_type || info.model)) {
                            resolve({
                                ip: targetIp,
                                mac: info.mac || null,
                                name: info.name || 'Sony Android TV',
                                brand: 'sony'
                            });
                        } else {
                            resolve(null);
                        }
                    } catch (e) { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
        });
        promises.push(p);
    }

    const results = await Promise.all(promises);
    const tvs = results.filter(r => r !== null);

    if (tvs.length > 0) {
        const foundTv = tvs[0];
        console.log(`TV Ditemukan: ${foundTv.name} di ${foundTv.ip} (MAC: ${foundTv.mac}) - Brand: ${foundTv.brand.toUpperCase()}`);
        saveTvConfig(foundTv);
        return foundTv;
    } else {
        console.log('Tidak ada TV Samsung, Xiaomi, Infinix, atau Sony yang ditemukan.');
        return null;
    }
}

// --- TV Connection ---
function connectToTv(config = null) {
    const tvConfig = config || loadTvConfig();

    if (!tvConfig || !tvConfig.ip) {
        console.log('IP TV belum diset.');
        return;
    }

    // Initialize adapter based on brand
    initAdapter(tvConfig);

    // Connect using the adapter
    if (tvConfig.brand === 'xiaomi') {
        tvAdapter.connect(64738);
    } else if (tvConfig.brand === 'infinix') {
        tvAdapter.connect(6466);
    } else if (tvConfig.brand === 'sony') {
        tvAdapter.connect(64738);
    } else {
        tvAdapter.connect(8002);
    }
}

function sendKey(key) {
    if (!tvAdapter) {
        console.log('Adapter belum diinisialisasi.');
        return;
    }
    tvAdapter.sendKey(key);
}

function sendText(text) {
    if (!tvAdapter) {
        console.log('Adapter belum diinisialisasi.');
        return;
    }
    tvAdapter.sendText(text);
}

function sendMouseMove(dx, dy) {
    if (!tvAdapter) return;
    tvAdapter.sendMouseMove(dx, dy);
}

function sendMouseClick() {
    if (!tvAdapter) return;
    tvAdapter.sendMouseClick();
}

async function scanAndConnect() {
    const config = loadTvConfig();

    if (config) {
        connectToTv(config);
    } else {
        const found = await scanForTv();
        if (found) {
            connectToTv(found);
        }
    }
}

io.on('connection', (socket) => {
    console.log('HP Terhubung ke Server Bridge!');

    const adapter = tvAdapter;
    const config = loadTvConfig();

    if (config) {
        if (adapter && adapter.isConnected()) {
            socket.emit('tv-status', `Terhubung ke ${config.name} (${config.brand.toUpperCase()})`);
        } else {
            socket.emit('tv-status', `Siap dor ke ${config.name} (${config.brand.toUpperCase()})`);
        }
    } else {
        socket.emit('tv-status', 'Belum terhubung ke TV');
    }

    socket.on('send-key', (key) => sendKey(key));
    socket.on('send-text', (text) => sendText(text));
    socket.on('mouse-move', (data) => sendMouseMove(data.dx, data.dy));
    socket.on('mouse-click', () => sendMouseClick());
    socket.on('force-scan', async () => {
        console.log('Menerima perintah force-scan dari HP');
        const found = await scanForTv();
        if (found) connectToTv(found);
    });
});

async function startServer() {
    // Start network scan and connect logic
    scanAndConnect();

    // Start Express Web Server
    const localIp = await internalIpV4();
    console.log(`\nBridge: http://${localIp}:${PORT}`);
    qrcode.toString(`http://${localIp}:5173`, { type: 'terminal', small: true }, (err, url) => {
        console.log('\nSCAN QR NYA BOS ALIF:\n');
        console.log(url);
    });
    server.listen(PORT, '0.0.0.0');
}

startServer();
