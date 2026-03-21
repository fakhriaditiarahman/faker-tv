const SamsungAdapter = require('../samsung-adapter');

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

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(() => ''),
  writeFileSync: jest.fn(),
}));

describe('SamsungAdapter', () => {
  let adapter;
  let mockIo;

  beforeEach(() => {
    mockIo = {
      emit: jest.fn(),
    };
    adapter = new SamsungAdapter(mockIo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create adapter with default values', () => {
      expect(adapter.currentPort).toBe(8002);
      expect(adapter.tvConfig).toEqual({ ip: null, mac: null, name: 'Samsung TV' });
      expect(adapter.tvWs).toBeNull();
    });

    test('should store io instance', () => {
      expect(adapter.io).toBe(mockIo);
    });
  });

  describe('setConfig', () => {
    test('should set TV configuration', () => {
      const config = {
        ip: '192.168.1.100',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'My Samsung TV',
        brand: 'samsung'
      };
      
      adapter.setConfig(config);
      
      expect(adapter.tvConfig).toEqual(config);
    });
  });

  describe('getConfig', () => {
    test('should return current TV configuration', () => {
      const config = {
        ip: '192.168.1.100',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'My Samsung TV'
      };
      
      adapter.setConfig(config);
      const result = adapter.getConfig();
      
      expect(result).toEqual(config);
    });
  });

  describe('getBrand', () => {
    test('should return "samsung"', () => {
      expect(adapter.getBrand()).toBe('samsung');
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

    test('should attempt reconnect when not connected', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = null;
      
      // Mock the connect method to avoid WebSocket constructor error
      adapter.connect = jest.fn();
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      adapter.sendKey('KEY_POWER');
      
      expect(consoleSpy).toHaveBeenCalledWith('Koneksi belum siap, mencoba menyambung kembali...');
      
      consoleSpy.mockRestore();
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

    test('should call doSendKey when connected', () => {
      adapter.setConfig({ ip: '192.168.1.100', mac: null, name: 'TV' });
      adapter.tvWs = { readyState: 1, send: jest.fn() };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      adapter.sendKey('KEY_VOLUMEUP');
      
      expect(consoleSpy).toHaveBeenCalledWith('Menembak: KEY_VOLUMEUP');
      
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
  });
});
