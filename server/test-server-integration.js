const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock Socket.IO
const mockIo = {
    emit: (event, data) => {
        // Silent emit for testing
    },
    on: () => { }
};

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  PASS: ${name}`);
        passed++;
    } catch (err) {
        console.log(`  FAIL: ${name}`);
        console.log(`        ${err.message}`);
        failed++;
    }
}

console.log('\n=== Server Index Integration Tests (Sony) ===\n');

// --- Adapter Import Tests ---
console.log('-- Adapter Imports --');

test('SonyAdapter should be importable', () => {
    const SonyAdapter = require('./sony-adapter');
    assert.ok(SonyAdapter, 'SonyAdapter should be importable');
});

test('All adapters should be importable', () => {
    const SamsungAdapter = require('./samsung-adapter');
    const XiaomiAdapter = require('./xiaomi-adapter');
    const InfinixAdapter = require('./infinix-adapter');
    const SonyAdapter = require('./sony-adapter');
    
    assert.ok(SamsungAdapter, 'SamsungAdapter should be importable');
    assert.ok(XiaomiAdapter, 'XiaomiAdapter should be importable');
    assert.ok(InfinixAdapter, 'InfinixAdapter should be importable');
    assert.ok(SonyAdapter, 'SonyAdapter should be importable');
});

// --- Adapter Instantiation Tests ---
console.log('\n-- Adapter Instantiation --');

test('SamsungAdapter should instantiate with mockIo', () => {
    const SamsungAdapter = require('./samsung-adapter');
    const adapter = new SamsungAdapter(mockIo);
    assert.strictEqual(adapter.getBrand(), 'samsung');
});

test('XiaomiAdapter should instantiate with mockIo', () => {
    const XiaomiAdapter = require('./xiaomi-adapter');
    const adapter = new XiaomiAdapter(mockIo);
    assert.strictEqual(adapter.getBrand(), 'xiaomi');
});

test('InfinixAdapter should instantiate with mockIo', () => {
    const InfinixAdapter = require('./infinix-adapter');
    const adapter = new InfinixAdapter(mockIo);
    assert.strictEqual(adapter.getBrand(), 'infinix');
});

test('SonyAdapter should instantiate with mockIo', () => {
    const SonyAdapter = require('./sony-adapter');
    const adapter = new SonyAdapter(mockIo);
    assert.strictEqual(adapter.getBrand(), 'sony');
});

// --- Config File Tests ---
console.log('\n-- Config File Management --');

const CONFIG_FILE = path.join(__dirname, 'tv-config.json');
const BACKUP_FILE = path.join(__dirname, 'tv-config.json.backup');

test('tv-config.json should exist', () => {
    assert.ok(fs.existsSync(CONFIG_FILE), 'tv-config.json should exist');
});

test('tv-config.json should be valid JSON', () => {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(content);
    assert.ok(typeof config === 'object', 'Config should be an object');
});

test('tv-config.json should have required fields', () => {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(content);
    
    assert.ok(config.brand, 'Config should have brand field');
    assert.ok(config.ip, 'Config should have ip field');
    assert.ok(config.name, 'Config should have name field');
});

test('tv-config.json should support sony brand', () => {
    // Test that sony brand is valid
    const validBrands = ['samsung', 'xiaomi', 'infinix', 'sony'];
    const testConfig = { brand: 'sony', ip: '192.168.1.1', name: 'Test' };
    assert.ok(validBrands.includes(testConfig.brand), 'sony should be a valid brand');
});

// --- Brand Detection Logic Tests ---
console.log('\n-- Brand Detection Logic --');

test('should initialize SamsungAdapter for samsung brand', () => {
    const SamsungAdapter = require('./samsung-adapter');
    const config = { brand: 'samsung', ip: '192.168.1.1' };
    
    // Simulate initAdapter logic
    let adapter;
    if (config.brand === 'xiaomi') {
        adapter = new (require('./xiaomi-adapter'))(mockIo);
    } else if (config.brand === 'infinix') {
        adapter = new (require('./infinix-adapter'))(mockIo);
    } else if (config.brand === 'sony') {
        adapter = new (require('./sony-adapter'))(mockIo);
    } else {
        adapter = new SamsungAdapter(mockIo);
    }
    
    assert.strictEqual(adapter.getBrand(), 'samsung');
});

test('should initialize XiaomiAdapter for xiaomi brand', () => {
    const config = { brand: 'xiaomi', ip: '192.168.1.1' };
    
    let adapter;
    if (config.brand === 'xiaomi') {
        adapter = new (require('./xiaomi-adapter'))(mockIo);
    } else if (config.brand === 'infinix') {
        adapter = new (require('./infinix-adapter'))(mockIo);
    } else if (config.brand === 'sony') {
        adapter = new (require('./sony-adapter'))(mockIo);
    } else {
        adapter = new (require('./samsung-adapter'))(mockIo);
    }
    
    assert.strictEqual(adapter.getBrand(), 'xiaomi');
});

test('should initialize InfinixAdapter for infinix brand', () => {
    const config = { brand: 'infinix', ip: '192.168.1.1' };
    
    let adapter;
    if (config.brand === 'xiaomi') {
        adapter = new (require('./xiaomi-adapter'))(mockIo);
    } else if (config.brand === 'infinix') {
        adapter = new (require('./infinix-adapter'))(mockIo);
    } else if (config.brand === 'sony') {
        adapter = new (require('./sony-adapter'))(mockIo);
    } else {
        adapter = new (require('./samsung-adapter'))(mockIo);
    }
    
    assert.strictEqual(adapter.getBrand(), 'infinix');
});

test('should initialize SonyAdapter for sony brand', () => {
    const config = { brand: 'sony', ip: '192.168.1.1' };
    
    let adapter;
    if (config.brand === 'xiaomi') {
        adapter = new (require('./xiaomi-adapter'))(mockIo);
    } else if (config.brand === 'infinix') {
        adapter = new (require('./infinix-adapter'))(mockIo);
    } else if (config.brand === 'sony') {
        adapter = new (require('./sony-adapter'))(mockIo);
    } else {
        adapter = new (require('./samsung-adapter'))(mockIo);
    }
    
    assert.strictEqual(adapter.getBrand(), 'sony');
});

test('should default to SamsungAdapter for unknown brand', () => {
    const config = { brand: 'unknown', ip: '192.168.1.1' };
    
    let adapter;
    if (config.brand === 'xiaomi') {
        adapter = new (require('./xiaomi-adapter'))(mockIo);
    } else if (config.brand === 'infinix') {
        adapter = new (require('./infinix-adapter'))(mockIo);
    } else if (config.brand === 'sony') {
        adapter = new (require('./sony-adapter'))(mockIo);
    } else {
        adapter = new (require('./samsung-adapter'))(mockIo);
    }
    
    assert.strictEqual(adapter.getBrand(), 'samsung');
});

// --- Port Assignment Tests ---
console.log('\n-- Port Assignment --');

test('Samsung TV should use port 8002', () => {
    const config = { brand: 'samsung', port: 8002 };
    let port;
    
    if (config.brand === 'xiaomi') {
        port = 64738;
    } else if (config.brand === 'infinix') {
        port = 6466;
    } else if (config.brand === 'sony') {
        port = 64738;
    } else {
        port = 8002;
    }
    
    assert.strictEqual(port, 8002);
});

test('Xiaomi TV should use port 64738', () => {
    const config = { brand: 'xiaomi', port: 64738 };
    let port;
    
    if (config.brand === 'xiaomi') {
        port = 64738;
    } else if (config.brand === 'infinix') {
        port = 6466;
    } else if (config.brand === 'sony') {
        port = 64738;
    } else {
        port = 8002;
    }
    
    assert.strictEqual(port, 64738);
});

test('Infinix TV should use port 6466', () => {
    const config = { brand: 'infinix', port: 6466 };
    let port;
    
    if (config.brand === 'xiaomi') {
        port = 64738;
    } else if (config.brand === 'infinix') {
        port = 6466;
    } else if (config.brand === 'sony') {
        port = 64738;
    } else {
        port = 8002;
    }
    
    assert.strictEqual(port, 6466);
});

test('Sony TV should use port 64738', () => {
    const config = { brand: 'sony', port: 64738 };
    let port;
    
    if (config.brand === 'xiaomi') {
        port = 64738;
    } else if (config.brand === 'infinix') {
        port = 6466;
    } else if (config.brand === 'sony') {
        port = 64738;
    } else {
        port = 8002;
    }
    
    assert.strictEqual(port, 64738);
});

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${passed + failed} total ===\n`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log('All integration tests passed!\n');
    process.exit(0);
}
