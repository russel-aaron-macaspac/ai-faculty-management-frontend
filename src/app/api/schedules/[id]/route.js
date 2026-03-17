import { createSupabaseAdminClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: schedule, error: fetchError } = await supabase
      .from("schedules")
      .select("schedule_id, shift_id")
      .eq("schedule_id", id)
      .single();

    if (fetchError || !schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const { error: scheduleDeleteError } = await supabase
      .from("schedules")
      .delete()
      .eq("schedule_id", id);

    if (scheduleDeleteError) {
      console.error("[SCHEDULE DELETE ERROR]", scheduleDeleteError);
      return NextResponse.json(
        { error: "Failed to delete schedule" },
        { status: 500 }
      );
    }

    await supabase
      .from("shifts")
      .delete()
      .eq("shift_id", schedule.shift_id);

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    console.error("[SCHEDULE DELETE ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}