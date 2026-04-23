export interface RFIDDevice {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  lastSeen: string;
  firmware_version?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFIDScan {
  id: string;
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
      roomId?: string | null;
    };
  };
}

export interface DeviceMetrics {
  deviceId: string;
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  uptime: number;
  lastScanTime: string | null;
}

export interface WebSocketMessage {
  type: 'scan' | 'heartbeat' | 'registration' | 'status' | 'error';
  payload: any;
  timestamp: string;
}
