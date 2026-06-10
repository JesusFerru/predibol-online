"use client";

import { useState, useMemo } from "react";
import { PredictionCard } from "./prediction-card";
import type { PredictionCardProps } from "./prediction-card";

export type MatchWithBet = PredictionCardProps;

interface DayGroup {
  dateLabel: string;
  dateKey: string;
  matches: MatchWithBet[];
}

interface PredictionListProps {
  dayGroups: DayGroup[];
}

export function PredictionList({ dayGroups }: PredictionListProps) {
  const todayKey = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const defaultIndex = useMemo(() => {
    const todayIdx = dayGroups.findIndex((g) => g.dateKey === todayKey);
    if (todayIdx !== -1) return todayIdx;

    const upcomingIdx = dayGroups.findIndex((g) => g.dateKey >= todayKey);
    return upcomingIdx !== -1 ? upcomingIdx : 0;
  }, [dayGroups, todayKey]);

  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  const selectedGroup = dayGroups[selectedIndex];

  if (dayGroups.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-4 flex justify-center">
          <svg
            className="h-16 w-16 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">
          No matches scheduled
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Match data has not been loaded yet. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Day selector tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 border-b border-gray-200 pb-1">
          {dayGroups.map((group, idx) => (
            <button
              key={group.dateKey}
              onClick={() => setSelectedIndex(idx)}
              className={`whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/30 ${
                idx === selectedIndex
                  ? "border-b-2 border-crimson bg-crimson/5 text-crimson"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {group.dateLabel}
              <span className="ml-1.5 text-xs opacity-70">
                ({group.matches.length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Match cards for selected day */}
      {selectedGroup ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {selectedGroup.matches.map((match) => (
            <PredictionCard
              key={match.matchId}
              matchId={match.matchId}
              team1={match.team1}
              team2={match.team2}
              team1Flag={match.team1Flag}
              team2Flag={match.team2Flag}
              team1Code={match.team1Code}
              team2Code={match.team2Code}
              scheduleAt={match.scheduleAt}
              matchStatus={match.matchStatus}
              group={match.group}
              round={match.round}
              ground={match.ground}
              existingBet={match.existingBet}
              isLocked={match.isLocked}
            />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-500">
          No matches for this date.
        </p>
      )}
    </div>
  );
}
