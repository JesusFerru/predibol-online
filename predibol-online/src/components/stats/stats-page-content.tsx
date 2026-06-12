import { AccuracyChart } from "@/components/stats/accuracy-chart";
import { HistoryTimeline } from "@/components/stats/history-timeline";
import { StatsCard } from "@/components/stats/stats-card";
import type { UserStats } from "@/lib/stats/user-stats";
import Link from "next/link";

interface StatsPageContentProps {
	stats: UserStats;
	testData: boolean;
	backHref: string;
	backLabel: string;
	toggleBaseHref: string;
}

function formatBs(value: number): string {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 2,
		minimumFractionDigits: 0,
	}).format(value);
}

export function StatsPageContent({
	stats,
	testData,
	backHref,
	backLabel,
	toggleBaseHref,
}: StatsPageContentProps) {
	return (
		<div className="mx-auto max-w-5xl px-4 py-8">
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Your Statistics</h1>
					<p className="mt-1 max-w-2xl text-sm text-gray-500">
						Personal prediction accuracy, points, and payout signals computed
						from your saved bets.
					</p>
					{stats.hasErrors && (
						<p className="mt-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
							Some Supabase reads failed, so this page is showing the data it
							could safely compute.
						</p>
					)}
					{stats.source === "test" && (
						<p className="mt-2 rounded-lg bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson">
							Preview mode is using sample data from <code>?testData=true</code>
							.
						</p>
					)}
				</div>

				<div className="flex flex-wrap gap-2">
					<Link
						href={backHref}
						className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
					>
						{backLabel}
					</Link>
				</div>
			</div>

			<div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<StatsCard
					label="Accuracy"
					value={`${stats.accuracyPercent}%`}
					helper={`${stats.exactScoreHits + stats.correctOutcomeHits}/${stats.finishedPredictions} finished`}
					tone="accent"
				/>
				<StatsCard
					label="Exact score rate"
					value={`${stats.exactRatePercent}%`}
					helper={`${stats.exactScoreHits} exact hits`}
				/>
				<StatsCard
					label="Total predictions"
					value={stats.totalPredictions}
					helper={`${stats.pendingPredictions} pending, ${stats.canceledPredictions} canceled`}
				/>
				<StatsCard
					label="Points"
					value={stats.totalPoints}
					helper={`Computed here: ${stats.computedPoints}`}
					tone="accent"
				/>
			</div>

			<div className="mb-6 grid gap-3 sm:grid-cols-2">
				<StatsCard
					label="Paid payouts"
					value={`Bs ${formatBs(stats.paidPayoutsBs)}`}
					helper="Daily payout rows marked paid"
				/>
				<StatsCard
					label="Pending payouts"
					value={`Bs ${formatBs(stats.pendingPayoutsBs)}`}
					helper="Daily payout rows awaiting payment"
				/>
			</div>

			<div className="space-y-6">
				<AccuracyChart stats={stats} />
				<HistoryTimeline history={stats.history} />
			</div>
		</div>
	);
}
