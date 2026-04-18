import { getWSManager } from '@/lib/websocket/wsManager';
import { createSupabaseAdminClient } from '@/lib/supabase/server-client';
import { WebSocketServer } from 'ws';

let wss = null;
const wsManager = getWSManager();

export async function GET(request) {
  // Extract upgrade header to detect WebSocket connection
  const upgradeHeader = request.headers.get('upgrade');
  const connectionHeader = request.headers.get('connection');

  if (upgradeHeader !== 'websocket' || !connectionHeader?.includes('upgrade')) {
    return new Response('Not a WebSocket connection', { status: 400 });
  }

  // Initialize WebSocket server if not already done
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
  }

  // Handle incoming WebSocket connections
  return new Promise((resolve) => {
    // Note: In production, you'd need a proper WebSocket upgrade handler
    // This is a simplified implementation for Next.js
    resolve(
      new Response('WebSocket endpoint - connect via ws://yourserver/api/rfid/ws', {
        status: 200,
      })
    );
  });
}

/**
 * Helper function to validate ESP32 device
 */
async function validateDevice(deviceId, apiKey) {
  // In production, verify the device in your database
  // For now, we'll use a simple check
  const validApiKey = process.env.RFID_DEVICE_API_KEY || 'default-api-key';
  return apiKey === validApiKey;
}

/**
 * WebSocket Connection Handler
 * This should be called from your server.js or a custom Next.js server
 */
export function setupWebSocketHandler() {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
  }

  return (ws, req, head) => {
    const url = new URL(req.url, `ws://${req.headers.host}`);
    const clientType = url.searchParams.get('type') || 'client';
    const clientId = url.searchParams.get('id');
    const deviceId = url.searchParams.get('deviceId');
    const apiKey = url.searchParams.get('apiKey');

    // Handle device connection (ESP32)
    if (clientType === 'device' && deviceId) {
      validateDevice(deviceId, apiKey).then((isValid) => {
        if (!isValid) {
          ws.close(1008, 'Unauthorized device');
          return;
        }

        wsManager.registerDevice(deviceId, ws, {
          location: url.searchParams.get('location') || 'Unknown',
          description: url.searchParams.get('description') || '',
        });

        // Handle messages from device
        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());

            if (message.type === 'rfid-scan') {
              wsManager.handleRFIDScan(deviceId, message.data);

              // Save to database
              await saveRFIDScan(deviceId, message.data);
            } else if (message.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            }
          } catch (error) {
            console.error(`[RFID] Error processing device message: ${error.message}`);
          }
        });

        ws.on('close', () => {
          wsManager.unregisterDevice(deviceId);
        });

        ws.on('error', (error) => {
          console.error(`[RFID] Device error: ${error.message}`);
          wsManager.unregisterDevice(deviceId);
        });
      });
    }
    // Handle client connection (Browser)
    else if (clientType === 'client' && clientId) {
      wsManager.registerClient(clientId, ws);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`[RFID] Client message:`, message);
        } catch (error) {
          console.error(`[RFID] Error parsing client message: ${error.message}`);
        }
      });

      ws.on('close', () => {
        wsManager.removeClient(clientId);
      });

      ws.on('error', (error) => {
        console.error(`[RFID] Client error: ${error.message}`);
        wsManager.removeClient(clientId);
      });
    } else {
      ws.close(1008, 'Invalid connection parameters');
    }
  };
}

/**
 * Save RFID scan to database
 */
async function saveRFIDScan(deviceId, scanData) {
  try {
    const supabase = createSupabaseAdminClient();
    const normalizedUID = scanData.uid.trim().toUpperCase();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Find user by RFID UID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, first_name, middle_name, last_name, role, status, employee_no, office_id')
      .eq('rfid_card_uid', normalizedUID)
      .eq('status', 'active')
      .single();

    if (userError || !user) {
      console.warn(`[RFID] Card not registered: ${normalizedUID}`);
      return { success: false, error: 'Card not registered' };
    }

    // Check if already scanned today
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id, time_in, time_out')
      .eq('user_id', user.user_id)
      .eq('date', today)
      .single();

    if (existingAttendance) {
      // Update time_out
      await supabase
        .from('attendance')
        .update({ time_out: now })
        .eq('id', existingAttendance.id);
    } else {
      // Create new attendance record
      await supabase.from('attendance').insert({
        user_id: user.user_id,
        date: today,
        time_in: now,
        status: 'present',
        device_id: deviceId,
      });
    }

    console.log(`[RFID] Attendance recorded for user: ${user.user_id}`);
    return { success: true };
  } catch (error) {
    console.error(`[RFID] Error saving scan: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export { wss };
