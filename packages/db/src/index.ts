import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema.js";

const defaultFile = resolve(process.cwd(), "data", "crew-goals.sqlite");

const bootstrapSql = `
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_distance REAL NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL,
  recommendation_tier TEXT NOT NULL,
  recommendation_source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  expired_at TEXT,
  result_locked_at TEXT,
  final_distance REAL
);

CREATE TABLE IF NOT EXISTS goal_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  join_time TEXT NOT NULL,
  contribution_distance REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS goal_invites (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  invitee_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  accepted_at TEXT,
  ignored_at TEXT,
  invalid_reason TEXT,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goal_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id TEXT,
  activity_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  distance REAL NOT NULL,
  activity_type TEXT NOT NULL,
  activity_source TEXT NOT NULL,
  activity_end_time TEXT NOT NULL,
  synced_at TEXT NOT NULL,
  counted_at TEXT NOT NULL,
  status TEXT NOT NULL,
  ignored_reason TEXT
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS goal_members_goal_user_unique
ON goal_members (goal_id, user_id);
`;

export function createDatabase(dbFile = defaultFile) {
  mkdirSync(dirname(dbFile), { recursive: true });

  const sqlite = new Database(dbFile);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(bootstrapSql);

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
    meta: {
      file: dbFile
    }
  };
}
