import { ProfileButton } from "@/components/profile/profile-button";
import { createClient } from "@/lib/supabase/server";

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name, alias, availablepoolcredits")
    .eq("id", user!.id)
    .single();

  const { data: ranking } = await supabase
    .from("tournamentranking")
    .select("points")
    .eq("userId", user!.id)
    .single();

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.name ?? "Player"}
        </h1>
        <p className="mt-2 text-gray-600">
          Match predictions will appear here once the tournament begins.
        </p>

        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 text-left">
          <h2 className="text-lg font-semibold text-gray-800">
            Tournament Status
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The FIFA World Cup 2026 starts on June 11, 2026. Predictions will
            open before the first match.
          </p>
          {ranking && (
            <p className="mt-2 text-sm text-gray-600">
              Your current points:{" "}
              <span className="font-semibold text-crimson">
                {ranking.points}
              </span>
            </p>
          )}
          {profile && (
            <p className="mt-1 text-sm text-gray-600">
              Available pool credits:{" "}
              <span className="font-semibold text-crimson">
                {profile.availablepoolcredits}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Floating profile button */}
      <ProfileButton
        userName={profile?.name ?? "Player"}
        userAlias={profile?.alias}
        userEmail={user!.email!}
        credits={profile?.availablepoolcredits ?? 0}
        points={ranking?.points ?? 0}
      />
    </div>
  );
}
