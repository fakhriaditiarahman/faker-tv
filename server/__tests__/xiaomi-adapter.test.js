const XiaomiAdapter = require('../xiaomi-adapter');

// Mock dependencies
jest.mock('ws', () => {
  return {
    OPEN: 1,
    CLOSED: 3,
  };
});

jest.mock('wake_on_lan', () => ({
  wake: jest.fn((mac, callback) => {
    if (callback) callback(null);
  }),
}));

jest.mock('http', () => ({
  request: jest.fn((options, callback) => {
    const mockReq = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    };
    return mockReq;
  }),
}));

describe('XiaomiAdapter', () => {
  let adapter;
  let mockIo;

  beforeEach(() => {
    mockIo = {
      emit: jest.fn(),
    };
    adapter = new XiaomiAdapter(mockIo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create adapter with default values', () => {
      expect(adapter.wsPort).toBe(64738);
      expect(adapter.httpPort).toBe(8081);
      expect(adapter.tvConfig).toEqual({ ip: null, mac: null, name: 'Xiaomi TV' });
      expect(adapter.tvWs).toBeNull();
    });

    test('should store io instance', () => {
      expect(adapter.io).toBe(mockIo);
    });
  });

  describe('KEY_CODES', () => {
    test('should have Android TV key codes defined', () => {
      const keyCodes = require('../xiaomi-adapter');
      // Access KEY_CODES through the module
      const moduleContent = require('fs').readFileSync(
        require.resolve('../xiaomi-adapter'),
        'utf8'
      );
      expect(moduleContent).toContain('KEY_POWER');
      expect(moduleContent).toContain('KEY_HOME');
    });
  });

  describe('setConfig', () => {
    test('should set TV configuration', () => {
      const config = {
        ip: '192.168.1.100',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'My Xiaomi TV',
        brand: 'xiaomi',
        port: 64738
      };
      
      adapter.setConfig(config);
      
      expect(adapter.tvConfig).toEqual(config);
    });

    test('should update wsPort if provided in config', () => {
      const config = {
        ip: '192.168.1.100',
        port: 9999
      };
      
      adapter.setConfig(config);
      
      expect(adapter.wsPort).toBe(9999);
    });
  });

  describe('getConfig', () => {
    test('should return current TV configuration', () => {
      const config = {
        ip: '192.168.1.100',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'My Xiaomi TV'
      };
      
      adapter.setConfig(config);
      const result = adapter.getConfig();
      
      expect(result).toEqual(config);
    });
  });

  describe('getBrand', () => {
    test('should return "xiaomi"', () => {
      expect(adapter.getBrand()).toBe('xiaomi');
    });
  });

  describe('isConnected', () => {
    test('should return false when no websocket connection', () => {
      expect(adapter.isConnected()).toBe(false);
    });

    test('should return true when websocket is open', () => {
      adapter.tvWs = { readyState: 1 }; // WebSocket.OPEN
      expect(adapter.isConnected()).toBe(true);
    });

    test('should return false when websocket is closed', () => {
      adapter.tvWs = { readyState: 3 }; // WebSocket.CLOSED
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('sendKey', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should handle KEY_POWER with WoL when MAC is set', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: 'AA:BB:CC:DD:EE:FF', name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      adapter.sendKey('KEY_POWER');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('MENGIRIM MAGIC PACKET (WAKE-ON-LAN)')
      );
      
      consoleSpy.mockRestore();
    });

    test('should use correct key code for KEY_POWER', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      adapter.sendKey('KEY_POWER');
      
      const payload = JSON.parse(adapter.tvWs.send.mock.calls[0][0]);
      expect(payload.keycode).toBe(26); // Android TV key code for power
      
      consoleSpy.mockRestore();
    });

    test('should use correct key code for KEY_HOME', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      adapter.sendKey('KEY_HOME');
      
      const payload = JSON.parse(adapter.tvWs.send.mock.calls[0][0]);
      expect(payload.keycode).toBe(3); // Android TV key code for home
    });

    test('should use correct key code for KEY_VOLUMEUP', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      adapter.sendKey('KEY_VOLUP');
      
      const payload = JSON.parse(adapter.tvWs.send.mock.calls[0][0]);
      expect(payload.keycode).toBe(24); // Android TV key code for volume up
    });

    test('should use correct key code for KEY_VOLDOWN', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      adapter.sendKey('KEY_VOLDOWN');
      
      const payload = JSON.parse(adapter.tvWs.send.mock.calls[0][0]);
      expect(payload.keycode).toBe(25); // Android TV key code for volume down
    });

    test('should use default key code for unknown keys', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      adapter.sendKey('KEY_UNKNOWN');
      
      const payload = JSON.parse(adapter.tvWs.send.mock.calls[0][0]);
      expect(payload.keycode).toBe(23); // Default to KEY_ENTER
    });

    test('should attempt reconnect when not connected', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = null;
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      adapter.sendKey('KEY_POWER');
      
      expect(consoleSpy).toHaveBeenCalledWith('Koneksi belum siap, mencoba menyambung kembali...');
      
      consoleSpy.mockRestore();
    });
  });

  describe('sendText', () => {
    test('should log error when not connected', () => {
      adapter.tvWs = null;
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      adapter.sendText('Hello');
      
      expect(consoleSpy).toHaveBeenCalledWith('Koneksi belum siap untuk kirim teks.');
      
      consoleSpy.mockRestore();
    });

    test('should send text when connected', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      adapter.sendText('Hello TV');
      
      expect(consoleSpy).toHaveBeenCalledWith('Mengetik ke TV: "Hello TV"');
      expect(adapter.tvWs.send).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('sendMouseMove', () => {
    test('should not send when not connected', () => {
      adapter.tvWs = null;
      
      expect(() => adapter.sendMouseMove(10, 10)).not.toThrow();
    });

    test('should send mouse move when connected', () => {
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      adapter.sendMouseMove(10, 20);
      
      expect(adapter.tvWs.send).toHaveBeenCalled();
    });

    test('should include dx and dy in payload', () => {
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      adapter.sendMouseMove(15, -25);
      
      const payload = JSON.parse(adapter.tvWs.send.mock.calls[0][0]);
      expect(payload.dx).toBe(15);
      expect(payload.dy).toBe(-25);
    });
  });

  describe('sendMouseClick', () => {
    test('should not send when not connected', () => {
      adapter.tvWs = null;
      
      expect(() => adapter.sendMouseClick()).not.toThrow();
    });

    test('should send mouse click when connected', () => {
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      adapter.sendMouseClick();
      
      expect(adapter.tvWs.send).toHaveBeenCalled();
    });

    test('should include left button in payload', () => {
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      adapter.sendMouseClick();
      
      const payload = JSON.parse(adapter.tvWs.send.mock.calls[0][0]);
      expect(payload.button).toBe('left');
    });
  });

  describe('sendHttpCommand', () => {
    test('should not send when no IP configured', () => {
      adapter.tvConfig.ip = null;
      
      expect(() => adapter.sendHttpCommand('/test', {})).not.toThrow();
    });

    test('should send HTTP request when IP is configured', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      
      adapter.sendHttpCommand('/controller/sysAction', { action: 'test' });
      
      const http = require('http');
      expect(http.request).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    test('should log error when IP not set', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      adapter.connect(64738);
      
      expect(consoleSpy).toHaveBeenCalledWith('IP TV belum diset.');
      
      consoleSpy.mockRestore();
    });
  });
});
