import { Shell } from "@/components/layout/shell";
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

  // Check whitelist authorization
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

  // Check payment status
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!getHasPaidEntry(profile)) {
    redirect("/payment-pending");
  }

  return <Shell>{children}</Shell>;
}
