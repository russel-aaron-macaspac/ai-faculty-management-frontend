import { io, Socket } from 'socket.io-client';

export interface RFIDDevice {
  id: string;
  device_id: string;
  name: string;
  location?: string;
  connectedAt: string;
  lastScan?: string;
  scanCount: number;
  description?: string;
  status: 'online' | 'offline';
}

export interface RFIDScan {
  deviceId: string;
  uid: string;
  timestamp: string;
  userId?: number;
  userName?: string;
  status: 'success' | 'failed' | 'not_registered';
  reason?: string;
  analysis?: {
    status?: string;
    message?: string;
    recommendation?: string;
    deviceRoom?: string;
    schedule?: {
      startTime?: string | null;
      endTime?: string | null;
      roomName?: string | null;
      roomId?: string | null;
    };
  };
  signal_strength?: number;
}

class RFIDService {
  private socket: Socket | null = null;
  private readonly clientId: string;
  private readonly messageHandlers: Map<string, (data: any) => void> = new Map();
  private devices: RFIDDevice[] = [];

  constructor() {
    this.clientId = this.generateClientId();
  }

  /**
   * Connect to Socket.IO server
   */
  connect(onScan?: (scan: RFIDScan) => void, onDeviceUpdate?: (devices: RFIDDevice[]) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = globalThis.location.protocol === 'https:' ? 'wss' : 'ws';
        const socketUrl = `${protocol}://${globalThis.location.host}`;

        this.socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
          query: { clientId: this.clientId },
        });

        this.socket.on('connect', () => {
          console.log('[RFID] Socket.IO connected');
          resolve();
        });

        this.socket.on('rfid_scan', (data: RFIDScan) => {
          this.handleMessage({ type: 'rfid_scan', payload: data }, onScan, onDeviceUpdate);
        });

        this.socket.on('devices_list', (data: { devices: RFIDDevice[] }) => {
          this.devices = data.devices;
          if (onDeviceUpdate) {
            onDeviceUpdate(data.devices);
          }
          this.messageHandlers.get('device-list')?.({ payload: { devices: data.devices } });
        });

        this.socket.on('device_status_update', (data: any) => {
          if (onDeviceUpdate) {
            onDeviceUpdate([data]);
          }
          this.messageHandlers.get('device-status')?.({ payload: data });
        });

        this.socket.on('error', (error: string) => {
          console.error('[RFID] Socket.IO error:', error);
          reject(new Error(error));
        });

        this.socket.on('disconnect', () => {
          console.log('[RFID] Socket.IO disconnected');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Socket.IO
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Send message to server
   */
  send(message: any): void {
    if (this.socket?.connected) {
      this.socket.emit(message.type, message.payload);
    } else {
      console.warn('[RFID] Socket.IO not connected');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(
    message: { type: string; payload: any },
    onScan?: (scan: RFIDScan) => void,
    onDeviceUpdate?: (devices: RFIDDevice[]) => void
  ): void {
    const { type, payload } = message;

    switch (type) {
      case 'rfid_scan':
        if (onScan) {
          onScan(payload);
        }
        this.messageHandlers.get('rfid-scan')?.({ payload });
        break;

      case 'device-list':
        if (onDeviceUpdate) {
          onDeviceUpdate(payload.devices);
        }
        this.messageHandlers.get('device-list')?.({ payload });
        break;

      case 'device-status':
        if (onDeviceUpdate && payload.devices) {
          onDeviceUpdate(payload.devices);
        }
        this.messageHandlers.get('device-status')?.({ payload });
        break;

      default:
        console.log('[RFID] Unknown message type:', type);
    }
  }

  /**
   * Register a message handler
   */
  on(eventType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(eventType, handler);
  }

  /**
   * Remove a message handler
   */
  off(eventType: string): void {
    this.messageHandlers.delete(eventType);
  }

  /**
   * Get connected devices
   */
  async getDevices(): Promise<RFIDDevice[]> {
    try {
      const response = await fetch('/api/iot/devices');
      const data = await response.json();
      this.devices = data.devices || [];
      return this.devices;
    } catch (error) {
      console.error('[RFID] Error fetching devices:', error);
      return this.devices;
    }
  }

  /**
   * Update device metadata
   */
  async updateDevice(deviceId: string, metadata: Partial<RFIDDevice>): Promise<void> {
    try {
      await fetch(`/api/iot/devices/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });
    } catch (error) {
      console.error('[RFID] Error updating device:', error);
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
let rfidService: RFIDService | null = null;

export function getRFIDService(): RFIDService {
  rfidService ??= new RFIDService();
  return rfidService;
}
