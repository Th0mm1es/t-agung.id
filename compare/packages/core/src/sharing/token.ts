/**
 * @bandinghidup/core — Sharing & Token Crypto Utilities
 *
 * Provides cryptographically secure token generation and SHA-256 key hashing
 * for private share links and community observation deletion keys.
 */

import { createHash, randomBytes } from "crypto";

/**
 * Generate a high-entropy, opaque URL-safe token.
 * Default length 16 characters.
 */
export function generateToken(length: number = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[(bytes[i] ?? 0) % chars.length];
  }
  return result;
}

/**
 * Compute SHA-256 hash of a revocation key or deletion token.
 */
export function hashKey(key: string): string {
  if (!key) throw new Error("Key to hash cannot be empty");
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Verify if a plain key matches a SHA-256 hash.
 */
export function verifyKeyHash(plainKey: string, expectedHash: string): boolean {
  const computed = hashKey(plainKey);
  return computed === expectedHash;
}
