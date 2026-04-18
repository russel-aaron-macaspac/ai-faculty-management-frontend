import { getWSManager } from '@/lib/websocket/wsManager';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const wsManager = getWSManager();
    const devices = wsManager.getAllDevices();

    return NextResponse.json({
      success: true,
      count: devices.length,
      devices,
    });
  } catch (error) {
    console.error('[RFID] Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rfid/devices
 * Register a new device or update device info
 */
export async function POST(request) {
  try {
    const { deviceId, location, description } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      );
    }

    const wsManager = getWSManager();
    const device = wsManager.getDevice(deviceId);

    if (!device) {
      return NextResponse.json(
        { error: 'Device not connected' },
        { status: 404 }
      );
    }

    // Update device metadata
    device.metadata.location = location || device.metadata.location;
    device.metadata.description = description || device.metadata.description;

    return NextResponse.json({
      success: true,
      device: {
        id: deviceId,
        ...device.metadata,
      },
    });
  } catch (error) {
    console.error('[RFID] Error updating device:', error);
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    );
  }
}
