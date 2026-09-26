import { describe, it, expect } from "vitest";
import { generateToken, hashKey, verifyKeyHash } from "./token.js";
import { sanitizeFreeText } from "./redact.js";

describe("Crypto Token & Hashing Utilities", () => {
  it("generates high-entropy tokens of requested length", () => {
    const token1 = generateToken(16);
    const token2 = generateToken(16);

    expect(token1).toHaveLength(16);
    expect(token2).toHaveLength(16);
    expect(token1).not.toBe(token2);
  });

  it("hashes revocation key with SHA-256 and verifies correctly", () => {
    const key = "revocation-secret-key-12345";
    const hash = hashKey(key);

    expect(hash).toHaveLength(64); // hex SHA-256 length
    expect(verifyKeyHash(key, hash)).toBe(true);
    expect(verifyKeyHash("wrong-key", hash)).toBe(false);
  });
});

describe("PII Redaction Engine", () => {
  it("leaves clean text untouched", () => {
    const res = sanitizeFreeText("Rent includes heating and hot water.");
    expect(res.hasPii).toBe(false);
    expect(res.sanitizedText).toBe("Rent includes heating and hot water.");
  });

  it("detects and redacts emails", () => {
    const res = sanitizeFreeText("Contact me at user@example.com for details.");
    expect(res.hasPii).toBe(true);
    expect(res.redactedTypes).toContain("email");
    expect(res.sanitizedText).toContain("[REDACTED EMAIL]");
  });

  it("detects and redacts phone numbers", () => {
    const res = sanitizeFreeText("Call +49 176 12345678 for room.");
    expect(res.hasPii).toBe(true);
    expect(res.redactedTypes).toContain("phone");
    expect(res.sanitizedText).toContain("[REDACTED PHONE]");
  });

  it("detects and redacts URLs and social handles", () => {
    const res = sanitizeFreeText("Check https://example.com or @john_doe");
    expect(res.hasPii).toBe(true);
    expect(res.redactedTypes).toContain("url");
    expect(res.redactedTypes).toContain("handle");
    expect(res.sanitizedText).toContain("[REDACTED URL]");
    expect(res.sanitizedText).toContain("[REDACTED HANDLE]");
  });
});
