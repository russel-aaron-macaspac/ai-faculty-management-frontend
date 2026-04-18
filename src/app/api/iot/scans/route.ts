import { createSupabaseAdminClient } from '@/lib/supabase/server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from('rfid_scans')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false });

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data: scans, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      scans: scans || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, uid, userId, status, reason } = body;

    if (!deviceId || !uid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: deviceId, uid',
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: scan, error } = await supabase
      .from('rfid_scans')
      .insert({
        device_id: deviceId,
        uid,
        user_id: userId,
        timestamp: new Date().toISOString(),
        status,
        reason,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      scan,
    });
  } catch (error) {
    console.error('Error creating scan record:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
