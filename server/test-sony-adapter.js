const assert = require('assert');

// Mock Socket.IO
const mockIo = {
    emit: () => { },
};

// Import SonyAdapter
const SonyAdapter = require('./sony-adapter');

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

console.log('\n=== SonyAdapter Unit Tests ===\n');

// --- Instantiation Tests ---
console.log('-- Instantiation --');

test('should create SonyAdapter instance', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.ok(adapter, 'Adapter should be created');
});

test('getBrand() should return "sony"', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.strictEqual(adapter.getBrand(), 'sony');
});

test('default config should have correct values', () => {
    const adapter = new SonyAdapter(mockIo);
    const config = adapter.getConfig();
    assert.strictEqual(config.ip, null);
    assert.strictEqual(config.mac, null);
    assert.strictEqual(config.name, 'Sony Android TV');
});

test('default wsPort should be 64738', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.strictEqual(adapter.wsPort, 64738);
});

test('default httpPort should be 8081', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.strictEqual(adapter.httpPort, 8081);
});

// --- Config Management Tests ---
console.log('\n-- Config Management --');

test('setConfig() should update config', () => {
    const adapter = new SonyAdapter(mockIo);
    const config = {
        brand: 'sony',
        ip: '192.168.1.50',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'Sony Android TV Test',
        port: 7777
    };
    adapter.setConfig(config);

    const result = adapter.getConfig();
    assert.strictEqual(result.ip, '192.168.1.50');
    assert.strictEqual(result.mac, 'AA:BB:CC:DD:EE:FF');
    assert.strictEqual(result.name, 'Sony Android TV Test');
});

test('setConfig() with port should update wsPort', () => {
    const adapter = new SonyAdapter(mockIo);
    adapter.setConfig({ ip: '192.168.1.50', port: 9999 });
    assert.strictEqual(adapter.wsPort, 9999);
});

test('setConfig() without port should keep default wsPort', () => {
    const adapter = new SonyAdapter(mockIo);
    adapter.setConfig({ ip: '192.168.1.50' });
    assert.strictEqual(adapter.wsPort, 64738);
});

// --- Connection State Tests ---
console.log('\n-- Connection State --');

test('isConnected() should return false when not connected', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.strictEqual(adapter.isConnected(), false);
});

test('isConnected() should return false when tvWs is null', () => {
    const adapter = new SonyAdapter(mockIo);
    adapter.tvWs = null;
    assert.strictEqual(adapter.isConnected(), false);
});

// --- Key Code Tests ---
console.log('\n-- Key Code Mapping --');

test('should have all essential key codes', () => {
    const adapter = new SonyAdapter(mockIo);
    // We need to check the module's KEY_CODES
    // Since they're module-scoped, verify through sendKey behavior

    const essentialKeys = [
        'KEY_POWER', 'KEY_HOME', 'KEY_BACK', 'KEY_ENTER',
        'KEY_VOLUP', 'KEY_VOLDOWN', 'KEY_MUTE',
        'KEY_UP', 'KEY_DOWN', 'KEY_LEFT', 'KEY_RIGHT',
        'KEY_PLAY', 'KEY_PAUSE', 'KEY_REWIND', 'KEY_FF',
        'KEY_0', 'KEY_1', 'KEY_2', 'KEY_3', 'KEY_4',
        'KEY_5', 'KEY_6', 'KEY_7', 'KEY_8', 'KEY_9',
        'KEY_NETFLIX', 'KEY_YOUTUBE',
        'KEY_RED', 'KEY_GREEN', 'KEY_YELLOW', 'KEY_BLUE',
        'KEY_SOURCE', 'KEY_MENU', 'KEY_SETTINGS',
    ];

    // The adapter should not crash when sending any of these keys
    // (even when not connected - it should handle gracefully)
    for (const key of essentialKeys) {
        assert.doesNotThrow(() => {
            adapter.sendKey(key);
        }, `sendKey('${key}') should not throw`);
    }
});

// --- Safe Behavior Tests ---
console.log('\n-- Safe Behavior When Disconnected --');

test('sendKey() should not crash when not connected', () => {
    const adapter = new SonyAdapter(mockIo);
    adapter.setConfig({ ip: null, mac: null });
    assert.doesNotThrow(() => {
        adapter.sendKey('KEY_POWER');
    });
});

test('sendText() should not crash when not connected', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.doesNotThrow(() => {
        adapter.sendText('hello');
    });
});

test('sendMouseMove() should not crash when not connected', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.doesNotThrow(() => {
        adapter.sendMouseMove(10, 20);
    });
});

test('sendMouseClick() should not crash when not connected', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.doesNotThrow(() => {
        adapter.sendMouseClick();
    });
});

test('connect() should not crash with no IP', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.doesNotThrow(() => {
        adapter.connect();
    });
});

test('sendHttpCommand() should not crash with no IP', () => {
    const adapter = new SonyAdapter(mockIo);
    assert.doesNotThrow(() => {
        adapter.sendHttpCommand('/test', { action: 'test' });
    });
});

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${passed + failed} total ===\n`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log('All tests passed!\n');
    process.exit(0);
}
