import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  isValidEmail,
  isValidPassword,
  isValidNickname,
} from "./auth";

describe("Password Hashing", () => {
  it("should hash a password", () => {
    const password = "TestPassword123";
    const hash = hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).toContain("$");
    expect(hash.split("$")).toHaveLength(3);
  });

  it("should verify a correct password", () => {
    const password = "TestPassword123";
    const hash = hashPassword(password);

    expect(verifyPassword(password, hash)).toBe(true);
  });

  it("should reject an incorrect password", () => {
    const password = "TestPassword123";
    const hash = hashPassword(password);

    expect(verifyPassword("WrongPassword123", hash)).toBe(false);
  });

  it("should produce different hashes for the same password", () => {
    const password = "TestPassword123";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(verifyPassword(password, hash1)).toBe(true);
    expect(verifyPassword(password, hash2)).toBe(true);
  });
});

describe("Email Validation", () => {
  it("should validate correct emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user@domain.co.uk")).toBe(true);
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("should reject invalid emails", () => {
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("should reject emails longer than 320 characters", () => {
    const longEmail = "a".repeat(310) + "@example.com";
    expect(isValidEmail(longEmail)).toBe(false);
  });
});

describe("Password Validation", () => {
  it("should validate strong passwords", () => {
    expect(isValidPassword("StrongPass123")).toBe(true);
    expect(isValidPassword("MyPassword456")).toBe(true);
    expect(isValidPassword("Secure1234Pass")).toBe(true);
  });

  it("should reject passwords shorter than 8 characters", () => {
    expect(isValidPassword("Short1A")).toBe(false);
    expect(isValidPassword("Pass1")).toBe(false);
  });

  it("should reject passwords without uppercase letters", () => {
    expect(isValidPassword("password123")).toBe(false);
  });

  it("should reject passwords without lowercase letters", () => {
    expect(isValidPassword("PASSWORD123")).toBe(false);
  });

  it("should reject passwords without numbers", () => {
    expect(isValidPassword("PasswordNoNum")).toBe(false);
  });
});

describe("Nickname Validation", () => {
  it("should validate correct nicknames", () => {
    expect(isValidNickname("user123")).toBe(true);
    expect(isValidNickname("john_doe")).toBe(true);
    expect(isValidNickname("alice_2024")).toBe(true);
  });

  it("should reject nicknames shorter than 3 characters", () => {
    expect(isValidNickname("ab")).toBe(false);
    expect(isValidNickname("a")).toBe(false);
  });

  it("should reject nicknames longer than 30 characters", () => {
    expect(isValidNickname("a".repeat(31))).toBe(false);
  });

  it("should reject nicknames with invalid characters", () => {
    expect(isValidNickname("user-name")).toBe(false);
    expect(isValidNickname("user name")).toBe(false);
    expect(isValidNickname("user@name")).toBe(false);
    expect(isValidNickname("user.name")).toBe(false);
  });

  it("should accept nicknames with underscores and alphanumeric characters", () => {
    expect(isValidNickname("user_123")).toBe(true);
    expect(isValidNickname("_underscore")).toBe(true);
    expect(isValidNickname("123_numbers")).toBe(true);
  });
});
