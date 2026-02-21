import crypto from "crypto";

/**
 * Hash a password using PBKDF2 with SHA256.
 * Returns a string in format: iterations$salt$hash
 */
export function hashPassword(password: string): string {
  const iterations = 100000;
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha256")
    .toString("hex");
  return `${iterations}$${salt}$${hash}`;
}

/**
 * Verify a password against a hash.
 * Hash should be in format: iterations$salt$hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const parts = hash.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const iterations = parseInt(parts[0], 10);
  const salt = parts[1];
  const storedHash = parts[2];

  const computedHash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha256")
    .toString("hex");

  return computedHash === storedHash;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320;
}

/**
 * Validate password strength
 * Requires: at least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) {
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  if (!/[a-z]/.test(password)) {
    return false;
  }
  if (!/[0-9]/.test(password)) {
    return false;
  }
  return true;
}

/**
 * Validate nickname
 * Requires: 3-30 characters, alphanumeric and underscores only
 */
export function isValidNickname(nickname: string): boolean {
  if (nickname.length < 3 || nickname.length > 30) {
    return false;
  }
  return /^[a-zA-Z0-9_]+$/.test(nickname);
}
