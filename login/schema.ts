import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  /** Email for email/password authentication */
  email: varchar("email", { length: 320 }).unique(),
  /** Hashed password for email/password authentication */
  passwordHash: text("passwordHash"),
  /** User's display name / nickname */
  nickname: varchar("nickname", { length: 255 }),
  /** URL to user's profile picture stored in S3 */
  profilePictureUrl: text("profilePictureUrl"),
  /** S3 key for the profile picture */
  profilePictureKey: varchar("profilePictureKey", { length: 512 }),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here