import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { RFIDDevice, RFIDScan } from '@/types/device';

interface UseRFIDSocketOptions {
  deviceId?: string;
  autoConnect?: boolean;
}

export function useRFIDSocket(options: UseRFIDSocketOptions = {}) {
  const { deviceId, autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<RFIDDevice[]>([]);
  const [lastScan, setLastScan] = useState<RFIDScan | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Determine protocol (ws for development, wss for production)
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${window.location.host}`;

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      query: deviceId ? { deviceId } : {},
    });

    socket.on('connect', () => {
      console.log('Connected to RFID WebSocket server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from RFID WebSocket server');
      setIsConnected(false);
    });

    socket.on('rfid_scan', (scan: RFIDScan) => {
      console.log('New RFID scan:', scan);
      setLastScan(scan);
    });

    socket.on('device_status_update', (update: any) => {
      console.log('Device status update:', update);
    });

    socket.on('devices_list', (data: { devices: RFIDDevice[] }) => {
      setConnectedDevices(data.devices);
    });

    socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [autoConnect, deviceId]);

  const registerDevice = useCallback(
    (deviceData: Partial<RFIDDevice>) => {
      if (socketRef.current) {
        socketRef.current.emit('register_device', deviceData);
      }
    },
    []
  );

  const sendRFIDScan = useCallback((uid: string) => {
    if (socketRef.current) {
      socketRef.current.emit('rfid_scan', {
        deviceId,
        uid,
        timestamp: new Date().toISOString(),
      });
    }
  }, [deviceId]);

  const sendHeartbeat = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('heartbeat', {
        deviceId,
        timestamp: new Date().toISOString(),
      });
    }
  }, [deviceId]);

  const getDevicesList = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('get_devices');
    }
  }, []);

  return {
    isConnected,
    connectedDevices,
    lastScan,
    registerDevice,
    sendRFIDScan,
    sendHeartbeat,
    getDevicesList,
    socket: socketRef.current,
  };
}
