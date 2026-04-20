import { createSupabaseAdminClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

const PENDING_SELECT_BASE = `
        id,
        faculty_id,
        subject_id,
        room_id,
        day,
        start_time,
        end_time,
        status,
        created_by,
        remarks,
        faculty:users!schedules_faculty_id_fkey (
          user_id,
          first_name,
          middle_name,
          last_name
        ),
        subject:subjects!schedules_subject_id_fkey (
          id,
          code,
          name
        ),
        room:rooms!schedules_room_id_fkey (
          id,
          name
        )
      `;

const PENDING_SELECT_WITH_SECTION = `
        id,
        faculty_id,
        section,
        subject_id,
        room_id,
        day,
        start_time,
        end_time,
        status,
        created_by,
        remarks,
        faculty:users!schedules_faculty_id_fkey (
          user_id,
          first_name,
          middle_name,
          last_name
        ),
        subject:subjects!schedules_subject_id_fkey (
          id,
          code,
          name
        ),
        room:rooms!schedules_room_id_fkey (
          id,
          name
        )
      `;

function isMissingSectionColumnError(error) {
  const message = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("column") && message.includes("section") && message.includes("does not exist");
}

function statusForRole(role) {
  if (role === "dean") return "pending_dean";
  if (role === "ovpaa") return "pending_ovpaa";
  if (role === "registrar" || role === "hro") return "pending_registrar";
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = statusForRole(role);

    if (!status) {
      return NextResponse.json({ data: [] });
    }

    const supabase = createSupabaseAdminClient();

    let { data, error } = await supabase
      .from("schedules")
      .select(PENDING_SELECT_WITH_SECTION)
      .eq("status", status)
      .order("created_at", { ascending: true });

    if (error && isMissingSectionColumnError(error)) {
      const fallbackResponse = await supabase
        .from("schedules")
        .select(PENDING_SELECT_BASE)
        .eq("status", status)
        .order("created_at", { ascending: true });

      data = fallbackResponse.data;
      error = fallbackResponse.error;
    }

    if (error) {
      console.error("[SCHEDULING PENDING ERROR]", error);
      return NextResponse.json({ error: "Failed to fetch pending schedules" }, { status: 500 });
    }

    return NextResponse.json({
      data: (data || []).map((row) => ({
        id: row.id,
        facultyId: String(row.faculty_id),
        facultyName: row.faculty
          ? [row.faculty.first_name, row.faculty.middle_name, row.faculty.last_name].filter(Boolean).join(" ")
          : "Unknown",
        subject: row.subject,
        room: row.room,
        section: row.section ?? null,
        day: row.day,
        startTime: String(row.start_time).slice(0, 5),
        endTime: String(row.end_time).slice(0, 5),
        status: row.status,
        remarks: row.remarks,
        createdBy: row.created_by,
      })),
    });
  } catch (err) {
    console.error("[SCHEDULING PENDING ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
