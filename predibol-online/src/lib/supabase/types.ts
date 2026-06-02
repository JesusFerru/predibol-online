// Database types for Predibol Online
// These mirror the schema defined in /database/schema.sql

export interface UserRow {
  id: string;
  email: string;
  name: string;
  alias: string;
  phoneNumber: string | null;
  hasPaidEntry: boolean;
  availablePoolCredits: number;
  isAdmin: boolean;
  createdAt: string;
}

export interface MatchResultRow {
  matchId: string;
  team1: string;
  team2: string;
  goal1: number | null;
  goal2: number | null;
  matchStatus: "PENDING" | "FINISHED" | "CANCELED";
  hasExtraPool: boolean;
  scheduleAt: string | null;
}

export interface MatchBetRow {
  id: number;
  userId: string;
  matchId: string;
  betGoalTeam1: number;
  betGoalTeam2: number;
  penaltyWinnerTeam: 1 | 2 | null;
  hasPaidExtraPool: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExtraPoolEntryRow {
  id: number;
  betId: number;
  amountBs: number;
  receiptUrl: string | null;
  paymentValidated: boolean;
  createdAt: string;
}

export interface MatchPoolRow {
  matchId: string;
  entryFeeBs: number;
  maintenancePercentage: number;
  rolloverAmountBs: number;
  totalCollectedBs: number;
  totalDistributedBs: number;
  maintenanceAmountBs: number;
  minimumPlayers: number;
  poolStatus: "OPEN" | "COMPLETED" | "CANCELED" | "ROLLED_OVER";
  processedAt: string | null;
  createdAt: string;
}

export interface WinnersBetRow {
  userId: string;
  winner1stPlace: string;
  winner2ndPlace: string;
  winner3rdPlace: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashInflowRow {
  id: number;
  userId: string;
  createdBy: string;
  amountBs: number;
  concept: string;
  receiptUrl: string | null;
  createdAt: string;
}

export interface DailyPayoutRow {
  id: number;
  matchId: string;
  userId: string;
  amountPaidBs: number;
  paymentStatus: boolean;
  payoutDate: string;
  paidAt: string | null;
}

export interface TournamentRankingRow {
  userId: string;
  points: number;
  updatedAt: string;
}
