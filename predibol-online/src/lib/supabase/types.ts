// Database types for Predibol Online
// These mirror the schema defined in /database/schema.sql
//
// IMPORTANT: PostgreSQL folds unquoted identifiers to lowercase.
// All property names must match the stored column name (all lowercase).

export interface AuthorizedUserRow {
  email: string;
  name: string;
  alias: string;
  is_admin: boolean;
  active: boolean;
  created_at: string;
}

export interface UserRow {
  id: string;
  email: string;
  name: string;
  alias: string;
  phonenumber: string | null;
  haspaidentry: boolean;
  availablepoolcredits: number;
  isadmin: boolean;
  createdat: string;
}

export interface MatchResultRow {
  matchid: string;
  team1: string;
  team2: string;
  goal1: number | null;
  goal2: number | null;
  matchstatus: "PENDING" | "FINISHED" | "CANCELED";
  hasextrapool: boolean;
  scheduleat: string | null;
}

export interface MatchBetRow {
  id: number;
  userid: string;
  matchid: string;
  betgoalteam1: number;
  betgoalteam2: number;
  penaltywinnerteam: 1 | 2 | null;
  haspaidextrapool: boolean;
  createdat: string;
  updatedat: string;
}

export interface ExtraPoolEntryRow {
  id: number;
  betid: number;
  amountbs: number;
  receipturl: string | null;
  paymentvalidated: boolean;
  createdat: string;
}

export interface MatchPoolRow {
  matchid: string;
  entryfeebs: number;
  maintenancepercentage: number;
  rolloveramountbs: number;
  totalcollectedbs: number;
  totaldistributedbs: number;
  maintenanceamountbs: number;
  minimumplayers: number;
  poolstatus: "OPEN" | "COMPLETED" | "CANCELED" | "ROLLED_OVER";
  processedat: string | null;
  createdat: string;
}

export interface WinnersBetRow {
  userid: string;
  winner1stplace: string;
  winner2ndplace: string;
  winner3rdplace: string;
  createdat: string;
  updatedat: string;
}

export interface CashInflowRow {
  id: number;
  userid: string;
  createdby: string;
  amountbs: number;
  concept: string;
  receipturl: string | null;
  createdat: string;
}

export interface DailyPayoutRow {
  id: number;
  matchid: string;
  userid: string;
  amountpaidbs: number;
  paymentstatus: boolean;
  payoutdate: string;
  paidat: string | null;
}

export interface TournamentRankingRow {
  userid: string;
  points: number;
  updatedat: string;
}
