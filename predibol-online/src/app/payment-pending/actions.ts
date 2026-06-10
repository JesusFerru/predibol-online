"use server";

import { createClient } from "@/lib/supabase/server";

export async function verifyPayment(): Promise<{ paid: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { paid: false };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("haspaidentry")
    .eq("id", user.id)
    .single();

  return { paid: profile?.haspaidentry ?? false };
}
