import { StatsPageContent } from "@/components/stats/stats-page-content";
import { fetchUserStats } from "@/lib/stats/user-stats";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface StatsPageProps {
  searchParams: Promise<{
    testData?: string | string[];
  }>;
}

function isEnabled(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return ["1", "true", "yes"].includes(String(raw ?? "").toLowerCase());
}

export default async function StatsPage({ searchParams }: StatsPageProps) {
  const params = await searchParams;
  const testData = isEnabled(params?.testData);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const stats = await fetchUserStats(user.id, { testData });

  return (
    <StatsPageContent
      stats={stats}
      testData={testData}
      backHref="/portal"
      backLabel="Back to Predictions"
      toggleBaseHref="/portal/stats"
    />
  );
}
