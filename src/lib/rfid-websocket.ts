import { Server as SocketIOServer } from 'socket.io';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server-client';

// Store active devices and sockets
const activeDevices = new Map();
const deviceSockets = new Map();
let ioInstance: SocketIOServer | null = null;

// Get or create Socket.IO instance
export function getSocketIOInstance() {
  if (!ioInstance) {
    ioInstance = new SocketIOServer({
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });
  }
  return ioInstance;
}

// Register device
export async function registerDevice(socket: any, deviceData: any) {
  const { deviceId, name, location, firmware_version } = deviceData;

  const supabase = createSupabaseAdminClient();

  // Check if device exists
  let device = activeDevices.get(deviceId);

  if (!device) {
    // Create new device in database
    const { data, error } = await supabase
      .from('rfid_devices')
      .insert({
        device_id: deviceId,
        name,
        location,
        firmware_version,
        status: 'online',
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering device:', error);
      socket.emit('device_registration_failed', { error: error.message });
      return;
    }

    device = data;
  } else {
    // Update device status to online
    await supabase
      .from('rfid_devices')
      .update({
        status: 'online',
        last_seen: new Date().toISOString(),
        firmware_version,
      })
      .eq('device_id', deviceId);
  }

  activeDevices.set(deviceId, {
    ...device,
    connectedAt: new Date().toISOString(),
  });

  deviceSockets.set(deviceId, socket);

  socket.join(`device:${deviceId}`);
  socket.emit('device_registered', { deviceId, success: true });

  // Broadcast device online status
  socket.broadcast.emit('device_status_update', {
    deviceId,
    status: 'online',
    timestamp: new Date().toISOString(),
  });

  console.log(`Device registered: ${deviceId} (${name})`);
}

// Handle RFID scan
export async function handleRFIDScan(socket: any, scanData: any) {
  const { deviceId, uid } = scanData;
  const supabase = createSupabaseAdminClient();

  const normalizedUID = uid.trim().toUpperCase();
  const scanTimestamp = new Date().toISOString();

  try {
    // Find user by RFID UID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, first_name, middle_name, last_name, role, status, employee_no, office_id')
      .eq('rfid_card_uid', normalizedUID)
      .eq('status', 'active')
      .single();

    if (userError || !user) {
      // Invalid or unregistered card
      const failedScan = {
        deviceId,
        uid: normalizedUID,
        timestamp: scanTimestamp,
        status: 'not_registered',
        reason: 'Card not registered or user inactive',
      };

      // Save to database
      await supabase.from('rfid_scans').insert(failedScan);

      // Emit to device and listeners
      socket.emit('scan_result', {
        ...failedScan,
        success: false,
      });

      socket.broadcast.emit('rfid_scan', failedScan);
      return;
    }

    // Get user's current schedule to determine expected status
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const { data: schedule } = await supabase
      .from('schedules')
      .select('start_time, end_time')
      .eq('employee_id', user.user_id)
      .eq('day_of_week', dayOfWeek)
      .single();

    let status = 'present';
    if (schedule?.start_time) {
      const [h, m, s] = schedule.start_time.split(':').map(Number);
      const shiftStart = new Date(
        `${today}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s ?? 0).padStart(2, '0')}`
      );
      shiftStart.setMinutes(shiftStart.getMinutes() + 15); // 15 min grace period
      status = new Date() > shiftStart ? 'late' : 'present';
    }

    // Record attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        user_id: user.user_id,
        date: today,
        time_in: new Date().toLocaleTimeString('en-US', { hour12: false }),
        device_id: deviceId,
        status,
      })
      .select()
      .single();

    if (attendanceError) throw attendanceError;

    // Record scan event
    const successfulScan = {
      deviceId,
      uid: normalizedUID,
      timestamp: scanTimestamp,
      userId: user.user_id,
      userName: `${user.first_name} ${user.last_name}`,
      status: 'success',
      attendanceStatus: status,
    };

    await supabase.from('rfid_scans').insert(successfulScan);

    // Emit to device and listeners
    socket.emit('scan_result', {
      ...successfulScan,
      success: true,
    });

    // Broadcast to all connected clients (live page, dashboard, etc.)
    socket.broadcast.emit('rfid_scan', successfulScan);

    console.log(
      `RFID Scan: ${user.first_name} ${user.last_name} at ${scanTimestamp} from device ${deviceId}`
    );
  } catch (error) {
    console.error('Error processing RFID scan:', error);

    const failedScan = {
      deviceId,
      uid: normalizedUID,
      timestamp: scanTimestamp,
      status: 'failed',
      reason: (error as Error).message,
    };

    await supabase.from('rfid_scans').insert(failedScan);

    socket.emit('scan_result', {
      ...failedScan,
      success: false,
    });

    socket.broadcast.emit('rfid_scan', failedScan);
  }
}

// Handle device disconnect
export async function handleDeviceDisconnect(deviceId: string) {
  const supabase = createSupabaseAdminClient();

  activeDevices.delete(deviceId);
  deviceSockets.delete(deviceId);

  // Update device status to offline
  await supabase
    .from('rfid_devices')
    .update({
      status: 'offline',
      last_seen: new Date().toISOString(),
    })
    .eq('device_id', deviceId);

  console.log(`Device disconnected: ${deviceId}`);
}

// Get active devices
export function getActiveDevices() {
  return Array.from(activeDevices.values());
}

// Get device by ID
export function getDeviceById(deviceId: string) {
  return activeDevices.get(deviceId);
}
