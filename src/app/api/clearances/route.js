import { createSupabaseAdminClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let query = supabase
      .from("clearance_documents")
      .select(
        `
        document_id,
        status,
        submitted_at,
        rejection_reason,
        user:users!fk_document_user (
          user_id,
          first_name,
          middle_name,
          last_name
        ),
        category:clearance_categories (
          category_id,
          name
        )
        `
      )
      .order("document_id", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[CLEARANCES GET ERROR]", error);
      return NextResponse.json(
        { error: "Failed to fetch clearances" },
        { status: 500 }
      );
    }

    const formatted = data.map((d) => {
      const fullName = d.user
        ? [d.user.first_name, d.user.middle_name, d.user.last_name]
            .filter(Boolean)
            .join(" ")
        : "Unknown";

      return {
        id:                String(d.document_id),
        employeeId:        String(d.user?.user_id ?? ""),
        employeeName:      fullName,
        requiredDocument:  d.category?.name ?? "",
        status:            d.status ?? "pending",
        submissionDate:    d.submitted_at ? d.submitted_at.split("T")[0] : null,
        validationWarning: d.rejection_reason ?? null,
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (err) {
    console.error("[CLEARANCES GET ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await request.json();
    const { employeeId, officeName, academicYear, semester } = body;

    console.log("[CLEARANCES POST BODY]", { employeeId, officeName, academicYear, semester });

    if (!employeeId || !officeName) {
      return NextResponse.json(
        { error: "employeeId and officeName are required" },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, status")
      .eq("user_id", employeeId)
      .single();

    console.log("[CLEARANCES POST USER]", { user, userError });

    if (userError || !user) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Cannot submit clearance for an inactive employee" },
        { status: 422 }
      );
    }

    const { data: category, error: categoryError } = await supabase
      .from("clearance_categories")
      .select("category_id")
      .ilike("name", officeName.trim())
      .single();

    console.log("[CLEARANCES POST CATEGORY]", { category, categoryError });

    if (categoryError || !category) {
      return NextResponse.json(
        { error: `No clearance category found matching "${officeName}"` },
        { status: 404 }
      );
    }

    const { data: existing } = await supabase
      .from("clearance_documents")
      .select("document_id, status")
      .eq("user_id", employeeId)
      .eq("category_id", category.category_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A document for this office has already been submitted" },
        { status: 409 }
      );
    }

    const { data: newDocument, error: insertError } = await supabase
      .from("clearance_documents")
      .insert({
        user_id:      employeeId,
        category_id:  category.category_id,
        academic_year: academicYear ?? null,
        semester:      semester ?? null,
        status:        "submitted",
        submitted_at:  new Date().toISOString(),
      })
      .select("document_id")
      .single();

    if (insertError) {
      console.error("[CLEARANCES POST ERROR]", insertError);
      return NextResponse.json(
        { error: "Failed to submit clearance document" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Document submitted successfully", id: String(newDocument.document_id) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[CLEARANCES POST ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}