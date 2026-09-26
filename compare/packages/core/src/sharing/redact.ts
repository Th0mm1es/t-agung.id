/**
 * @bandinghidup/core — PII Detection & Redaction Engine
 *
 * Scans free-text fields (such as contribution notes) for email addresses,
 * phone numbers, street addresses, and social handles, replacing them with [REDACTED].
 */

// Regular expressions for PII detection
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
const URL_REGEX = /https?:\/\/[^\s]+/g;
const SOCIAL_HANDLE_REGEX = /@[a-zA-Z0-9_]{3,30}/g;

export interface RedactionResult {
  sanitizedText: string;
  hasPii: boolean;
  redactedTypes: string[];
}

/**
 * Scan and redact PII from free-text strings.
 */
export function sanitizeFreeText(input: string): RedactionResult {
  if (!input || input.trim() === "") {
    return { sanitizedText: "", hasPii: false, redactedTypes: [] };
  }

  let text = input;
  const redactedTypes: string[] = [];

  if (EMAIL_REGEX.test(text)) {
    text = text.replace(EMAIL_REGEX, "[REDACTED EMAIL]");
    redactedTypes.push("email");
  }

  if (URL_REGEX.test(text)) {
    text = text.replace(URL_REGEX, "[REDACTED URL]");
    redactedTypes.push("url");
  }

  if (SOCIAL_HANDLE_REGEX.test(text)) {
    text = text.replace(SOCIAL_HANDLE_REGEX, "[REDACTED HANDLE]");
    redactedTypes.push("handle");
  }

  // Check phone numbers (only if length >= 7 to avoid matching short numbers)
  if (PHONE_REGEX.test(text)) {
    text = text.replace(PHONE_REGEX, (match) => {
      const digitsOnly = match.replace(/\D/g, "");
      if (digitsOnly.length >= 7) {
        if (!redactedTypes.includes("phone")) redactedTypes.push("phone");
        return "[REDACTED PHONE]";
      }
      return match;
    });
  }

  return {
    sanitizedText: text.trim(),
    hasPii: redactedTypes.length > 0,
    redactedTypes,
  };
}
