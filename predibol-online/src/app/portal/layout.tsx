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

  if (!user) {
    redirect("/login");
  }

  // Check whitelist and payment status
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
