// WebSocket Connection Manager for RFID devices
// Handles device connections, disconnections, and message broadcasting

class RFIDWebSocketManager {
  constructor() {
    this.devices = new Map(); // Map<deviceId, { ws, metadata }>
    this.clients = new Map(); // Map<clientId, { ws, type }> - browsers
    this.messageHandlers = new Map();
  }

  // Register a new device connection
  registerDevice(deviceId, ws, metadata = {}) {
    this.devices.set(deviceId, {
      ws,
      metadata: {
        ...metadata,
        connectedAt: new Date().toISOString(),
        lastScan: null,
        scanCount: 0,
      },
    });

    console.log(`[RFID] Device connected: ${deviceId}`);
    this.broadcastToClients('device-status', {
      action: 'connected',
      deviceId,
      devices: Array.from(this.devices.keys()),
    });
  }

  // Register a browser client connection
  registerClient(clientId, ws) {
    this.clients.set(clientId, { ws, type: 'browser' });
    console.log(`[RFID] Client connected: ${clientId}`);
    
    // Send initial device status
    this.sendToClient(clientId, 'device-list', {
      devices: Array.from(this.devices.entries()).map(([id, data]) => ({
        id,
        ...data.metadata,
      })),
    });
  }

  // Handle RFID scan from device
  handleRFIDScan(deviceId, scanData) {
    const device = this.devices.get(deviceId);
    if (!device) return;

    // Update device metadata
    device.metadata.lastScan = new Date().toISOString();
    device.metadata.scanCount++;

    const rfidMessage = {
      deviceId,
      uid: scanData.uid,
      timestamp: new Date().toISOString(),
      signal_strength: scanData.signal_strength || null,
    };

    // Broadcast to all clients
    this.broadcastToClients('rfid-scan', rfidMessage);
  }

  // Handle device disconnect
  unregisterDevice(deviceId) {
    this.devices.delete(deviceId);
    console.log(`[RFID] Device disconnected: ${deviceId}`);

    this.broadcastToClients('device-status', {
      action: 'disconnected',
      deviceId,
      devices: Array.from(this.devices.keys()),
    });
  }

  // Send message to specific client
  sendToClient(clientId, type, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) {
      client.ws.send(
        JSON.stringify({
          type,
          payload: data,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  // Broadcast to all connected clients
  broadcastToClients(type, data) {
    const message = JSON.stringify({
      type,
      payload: data,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === 1) {
        client.ws.send(message);
      } else {
        this.clients.delete(clientId);
      }
    });
  }

  // Broadcast to all connected devices
  broadcastToDevices(type, data) {
    const message = JSON.stringify({
      type,
      payload: data,
      timestamp: new Date().toISOString(),
    });

    this.devices.forEach((device, deviceId) => {
      if (device.ws.readyState === 1) {
        device.ws.send(message);
      } else {
        this.unregisterDevice(deviceId);
      }
    });
  }

  // Get device status
  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  // Get all devices
  getAllDevices() {
    return Array.from(this.devices.entries()).map(([id, data]) => ({
      id,
      ...data.metadata,
    }));
  }

  // Cleanup client
  removeClient(clientId) {
    this.clients.delete(clientId);
    console.log(`[RFID] Client removed: ${clientId}`);
  }
}

// Singleton instance
let wsManager = null;

export function getWSManager() {
  if (!wsManager) {
    wsManager = new RFIDWebSocketManager();
  }
  return wsManager;
}
