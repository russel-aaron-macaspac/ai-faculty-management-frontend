import { createSupabaseAdminClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

function isMissingSectionsTableError(error) {
  const message = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return (
    (message.includes("relation") && message.includes("sections") && message.includes("does not exist")) ||
    (message.includes("table") && message.includes("sections") && message.includes("schema cache")) ||
    (message.includes("table") && message.includes("public.sections"))
  );
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const payload = {};
    if (body?.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      payload.name = name;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("sections")
      .update(payload)
      .eq("id", id)
      .select("id, name")
      .single();

    if (error) {
      if (isMissingSectionsTableError(error)) {
        return NextResponse.json(
          { error: "Sections table is not set up yet. Run the SQL migration to enable editing sections." },
          { status: 400 }
        );
      }

      console.error("[SECTIONS PUT ERROR]", error);
      return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
    }

    return NextResponse.json({ message: "Section updated", data });
  } catch (err) {
    console.error("[SECTIONS PUT ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) {
      if (isMissingSectionsTableError(error)) {
        return NextResponse.json(
          { error: "Sections table is not set up yet. Run the SQL migration to enable deleting sections." },
          { status: 400 }
        );
      }

      console.error("[SECTIONS DELETE ERROR]", error);
      return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
    }

    return NextResponse.json({ message: "Section deleted" });
  } catch (err) {
    console.error("[SECTIONS DELETE ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
