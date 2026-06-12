import { Shell } from "@/components/layout/shell";
import { StatsPageContent } from "@/components/stats/stats-page-content";
import { buildTestUserStats, fetchUserStats } from "@/lib/stats/user-stats";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PublicStatsPageProps {
  searchParams: Promise<{
    testData?: string | string[];
  }>;
}

function isEnabled(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return ["1", "true", "yes"].includes(String(raw ?? "").toLowerCase());
}

export default async function PublicStatsPage({
  searchParams,
}: PublicStatsPageProps) {
  const params = await searchParams;
  const testData = isEnabled(params?.testData);

  if (testData) {
    return (
      <Shell>
        <StatsPageContent
          stats={buildTestUserStats()}
          testData
          backHref="/login"
          backLabel="Back to Login"
          toggleBaseHref="/stats"
        />
      </Shell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <Shell>
      <StatsPageContent
        stats={await fetchUserStats(user.id)}
        testData={false}
        backHref="/portal"
        backLabel="Back to Predictions"
        toggleBaseHref="/stats"
      />
    </Shell>
  );
}
