"use server";

import { createClient } from "@/lib/supabase/server";

function getHasPaidEntry(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false;
  return Boolean(
    (profile as Record<string, boolean>).haspaidentry ??
    (profile as Record<string, boolean>).hasPaidEntry ??
    false,
  );
}

export async function verifyPayment(): Promise<{ paid: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { paid: false };
  }

  let { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.rpc("sync_user_from_auth");

    const result = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    profile = result.data;
  }

  return { paid: getHasPaidEntry(profile) };
}