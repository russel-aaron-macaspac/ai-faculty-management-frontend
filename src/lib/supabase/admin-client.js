import { createClient } from "@supabase/supabase-js";

function parseJwtPayload(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;

    const base64 = payloadBase64.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function assertServiceRoleKey(serviceRoleKey) {
  if (serviceRoleKey.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is using a publishable key. Set it to your Supabase service role key."
    );
  }

  const jwtPayload = parseJwtPayload(serviceRoleKey);
  if (jwtPayload?.role && jwtPayload.role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY role is '${jwtPayload.role}', expected 'service_role'.`
    );
  }
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  assertServiceRoleKey(serviceRoleKey);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}