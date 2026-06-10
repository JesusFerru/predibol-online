import { Shell } from "@/components/layout/shell";
import { isVerifiedToday, setVerificationCookie } from "@/lib/auth/verification";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function getHasPaidEntry(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false;
  return Boolean(
    (profile as Record<string, boolean>).haspaidentry ??
    (profile as Record<string, boolean>).hasPaidEntry ??
    false,
  );
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  // Fast path: if verified today, skip DB checks
  if (await isVerifiedToday()) {
    return <Shell>{children}</Shell>;
  }

  // Slow path: run full verification chain
  const { data: authUser } = await supabase
    .from("authorized_users")
    .select("email")
    .eq("email", user.email)
    .eq("active", true)
    .single();

  if (!authUser) {
    await supabase.auth.signOut();
    redirect("/unauthorized");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!getHasPaidEntry(profile)) {
    redirect("/payment-pending");
  }

  // Cache verification in browser for the rest of the day
  await setVerificationCookie();

  return <Shell>{children}</Shell>;
}
