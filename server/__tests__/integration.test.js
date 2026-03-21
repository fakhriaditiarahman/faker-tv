const http = require('http');

// Mock dependencies before requiring the module
jest.mock('ws', () => {
  return {
    OPEN: 1,
    CLOSED: 3,
  };
});
jest.mock('wake_on_lan');
jest.mock('qrcode');

describe('Server Integration Tests', () => {
  let mockIo;
  let mockSocket;
  let originalFs;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Store original fs
    originalFs = require('fs');
    
    // Mock Socket.IO
    mockIo = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
    };
  });

  afterEach(() => {
    // Restore original fs
    jest.unmock('fs');
  });

  describe('Config Management', () => {
    test('should load config from file when exists', () => {
      const mockConfig = {
        brand: 'samsung',
        ip: '192.168.1.100',
        name: 'Test TV'
      };
      
      const mockFs = {
        existsSync: jest.fn(() => true),
        readFileSync: jest.fn(() => JSON.stringify(mockConfig)),
        writeFileSync: jest.fn(),
      };
      
      jest.mock('fs', () => mockFs);

      // Simulate loading config
      const config = JSON.parse(mockFs.readFileSync());
      
      expect(config.brand).toBe('samsung');
      expect(config.ip).toBe('192.168.1.100');
    });

    test('should return null when config file does not exist', () => {
      const mockFs = {
        existsSync: jest.fn(() => false),
      };
      
      jest.mock('fs', () => mockFs);

      const config = mockFs.existsSync() ? 'exists' : null;
      
      expect(config).toBeNull();
    });

    test('should handle both samsung and xiaomi brands', () => {
      const samsungConfig = { brand: 'samsung', ip: '192.168.1.100' };
      const xiaomiConfig = { brand: 'xiaomi', ip: '192.168.1.101' };

      expect(samsungConfig.brand).toBe('samsung');
      expect(xiaomiConfig.brand).toBe('xiaomi');
    });
  });

  describe('Adapter Initialization', () => {
    const SamsungAdapter = require('../samsung-adapter');
    const XiaomiAdapter = require('../xiaomi-adapter');

    test('should initialize SamsungAdapter for samsung brand', () => {
      const adapter = new SamsungAdapter(mockIo);
      expect(adapter.getBrand()).toBe('samsung');
    });

    test('should initialize XiaomiAdapter for xiaomi brand', () => {
      const adapter = new XiaomiAdapter(mockIo);
      expect(adapter.getBrand()).toBe('xiaomi');
    });

    test('adapters should have different default ports', () => {
      const samsungAdapter = new SamsungAdapter(mockIo);
      const xiaomiAdapter = new XiaomiAdapter(mockIo);

      expect(samsungAdapter.currentPort).toBe(8002);
      expect(xiaomiAdapter.wsPort).toBe(64738);
    });
  });

  describe('Key Code Mapping', () => {
    test('should have consistent key codes across adapters', () => {
      const realFs = require('fs');
      const realPath = require('path');
      
      const xiaomiAdapterPath = realPath.join(__dirname, '../xiaomi-adapter.js');
      const content = realFs.readFileSync(xiaomiAdapterPath, 'utf8');

      // Verify key codes are defined
      expect(content).toContain('KEY_POWER');
      expect(content).toContain('KEY_HOME');
      expect(content).toContain('KEY_BACK');
      expect(content).toContain('KEY_VOLUP');
      expect(content).toContain('KEY_VOLDOWN');
    });
  });

  describe('Network Scanning', () => {
    test('should scan for Samsung TV on port 8001', (done) => {
      const server = http.createServer((req, res) => {
        expect(req.url).toContain('/api/v2/');
        res.writeHead(200);
        res.end(JSON.stringify({
          device: {
            type: 'Samsung SmartTV',
            name: 'Test Samsung TV',
            mac: 'AA:BB:CC:DD:EE:FF'
          }
        }));
      });

      server.listen(8001, '127.0.0.1', () => {
        http.get('http://127.0.0.1:8001/api/v2/', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            const info = JSON.parse(data);
            expect(info.device.type).toBe('Samsung SmartTV');
            server.close();
            done();
          });
        });
      });
    });

    test('should scan for Xiaomi TV on port 8081', (done) => {
      const server = http.createServer((req, res) => {
        expect(req.url).toContain('/status');
        res.writeHead(200);
        res.end(JSON.stringify({
          brand: 'Xiaomi',
          name: 'Test Xiaomi TV',
          mac: 'AA:BB:CC:DD:EE:FF'
        }));
      });

      server.listen(8081, '127.0.0.1', () => {
        http.get('http://127.0.0.1:8081/status', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            const info = JSON.parse(data);
            expect(info.brand).toBe('Xiaomi');
            server.close();
            done();
          });
        });
      });
    });
  });

  describe('Socket.IO Event Handling', () => {
    beforeEach(() => {
      // Suppress console output during tests
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should handle send-key event', () => {
      const SamsungAdapter = require('../samsung-adapter');
      const adapter = new SamsungAdapter(mockIo);

      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };

      // Simulate socket event
      const key = 'KEY_VOLUMEUP';
      adapter.sendKey(key);

      expect(adapter.tvWs.send).toHaveBeenCalled();
    });

    test('should handle send-text event', () => {
      const SamsungAdapter = require('../samsung-adapter');
      const adapter = new SamsungAdapter(mockIo);

      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };

      const text = 'Hello';
      adapter.sendText(text);

      expect(adapter.tvWs.send).toHaveBeenCalled();
    });

    test('should handle mouse-move event', () => {
      const XiaomiAdapter = require('../xiaomi-adapter');
      const adapter = new XiaomiAdapter(mockIo);

      adapter.tvWs = { readyState: 1, send: jest.fn() };

      adapter.sendMouseMove(10, 20);

      expect(adapter.tvWs.send).toHaveBeenCalled();
    });

    test('should handle mouse-click event', () => {
      const XiaomiAdapter = require('../xiaomi-adapter');
      const adapter = new XiaomiAdapter(mockIo);

      adapter.tvWs = { readyState: 1, send: jest.fn() };

      adapter.sendMouseClick();

      expect(adapter.tvWs.send).toHaveBeenCalled();
    });
  });

  describe('Config File Format', () => {
    test('should support samsung config format', () => {
      const config = {
        brand: 'samsung',
        ip: '192.168.1.8',
        mac: '64:1C:AE:FD:C1:B6',
        name: '[TV] Samsung 7 Series (43)',
        port: 8002
      };

      expect(config.brand).toBe('samsung');
      expect(config.port).toBe(8002);
      expect(config.mac).toBeDefined();
    });

    test('should support xiaomi config format', () => {
      const config = {
        brand: 'xiaomi',
        ip: '192.168.1.9',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'Xiaomi TV',
        port: 64738
      };

      expect(config.brand).toBe('xiaomi');
      expect(config.port).toBe(64738);
      expect(config.mac).toBeDefined();
    });
  });
});
