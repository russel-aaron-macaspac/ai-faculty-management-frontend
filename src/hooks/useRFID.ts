import { useEffect, useState, useCallback, useRef } from 'react';
import { getRFIDService, RFIDScan, RFIDDevice } from '@/services/rfidService';

export interface UseRFIDOptions {
  autoConnect?: boolean;
  onScan?: (scan: RFIDScan) => void;
  onDeviceUpdate?: (devices: RFIDDevice[]) => void;
  onError?: (error: Error) => void;
}

export function useRFID(options: UseRFIDOptions = {}) {
  const { autoConnect = true, onScan, onDeviceUpdate, onError } = options;
  
  const [devices, setDevices] = useState<RFIDDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastScan, setLastScan] = useState<RFIDScan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef(getRFIDService());

  // Connect to WebSocket (only once on mount)
  useEffect(() => {
    if (!autoConnect) return;

    const service = serviceRef.current;

    const handleScan = (scan: RFIDScan) => {
      setLastScan(scan);
      onScan?.(scan);
    };

    const handleDeviceUpdate = (updatedDevices: RFIDDevice[]) => {
      setDevices(updatedDevices);
      onDeviceUpdate?.(updatedDevices);
    };

    service
      .connect(handleScan, handleDeviceUpdate)
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err) => {
        const errorMsg = err.message || 'Failed to connect to RFID service';
        setError(errorMsg);
        onError?.(new Error(errorMsg));
      });

    return () => {
      service.disconnect();
      setIsConnected(false);
    };
  }, [autoConnect]); // ✅ Only depend on autoConnect, not callbacks

  const connect = useCallback(async () => {
    try {
      const service = serviceRef.current;
      await service.connect(
        (scan) => {
          setLastScan(scan);
          onScan?.(scan);
        },
        (updatedDevices) => {
          setDevices(updatedDevices);
          onDeviceUpdate?.(updatedDevices);
        }
      );
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
    }
  }, [onScan, onDeviceUpdate, onError]);

  const disconnect = useCallback(() => {
    serviceRef.current.disconnect();
    setIsConnected(false);
  }, []);

  const getDevices = useCallback(async () => {
    try {
      const updatedDevices = await serviceRef.current.getDevices();
      setDevices(updatedDevices);
      return updatedDevices;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch devices';
      setError(errorMsg);
      return [];
    }
  }, []);

  return {
    devices,
    isConnected,
    lastScan,
    error,
    connect,
    disconnect,
    getDevices,
  };
}
