/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

/**
 * Authentication types
 */
export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  profilePictureUrl: string | null;
  role: "user" | "admin";
  createdAt: Date;
}

export interface SignupInput {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileUpdateInput {
  nickname?: string;
  profilePictureUrl?: string;
  profilePictureKey?: string;
}
