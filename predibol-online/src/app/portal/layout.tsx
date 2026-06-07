import { Shell } from "@/components/layout/shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    .from("Users")
    .select("hasPaidEntry")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.hasPaidEntry) {
    redirect("/payment-pending");
  }

  return <Shell>{children}</Shell>;
}
