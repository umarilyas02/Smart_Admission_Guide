function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

function wordCount(str) {
  return String(str).trim().split(/\s+/).filter(Boolean).length;
}

function hasInjection(value) {
  const sql = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|WHERE|FROM|TABLE|DATABASE|SCRIPT)\b/i;
  const xss = /<[^>]*>|javascript:|on\w+\s*=/i;
  return sql.test(value) || xss.test(value);
}

function toRegExp(pattern) {
  if (!pattern) return null;
  if (pattern instanceof RegExp) return pattern;
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

/**
 * Validates a value based on its semantic type.
 * Returns an error string or null if valid.
 *
 * Supported types: email, phone, password, confirm-password, name, alpha,
 *   cnic, otp, percentage, year, number, marks, text, textarea, select,
 *   date, file
 */
export function validate(type, value, { required = false, compareValue, min, max, minLength, maxLength, maxWords, allowedPattern, allowedPatternMessage } = {}) {
  const empty = isEmpty(value);

  if (empty) return required ? "This field is required" : null;

  const raw = String(value);
  const trimmed = raw.trim();
  const pattern = toRegExp(allowedPattern);

  switch (type) {
    case "email":
      if (typeof maxLength === "number" && raw.length > maxLength) return `Must be at most ${maxLength} characters`;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
        ? null
        : "Enter a valid email address";

    case "phone": {
      const clean = raw.replace(/[\s\-()+]/g, "");
      // Accepts: 03XXXXXXXXX (11), 3XXXXXXXXX (10), +923XXXXXXXXX / 923XXXXXXXXX (12)
      return /^(92)?0?3\d{9}$/.test(clean)
        ? null
        : "Enter a valid Pakistani mobile number (e.g. 03001234567)";
    }

    case "password":
      return value.length >= 6 ? null : "Password must be at least 6 characters";

    case "confirm-password":
      return value === compareValue ? null : "Passwords do not match";

    case "name":
      if (trimmed.length < (minLength ?? 2)) return "Name must be at least 2 characters";
      if (trimmed.length > (maxLength ?? 50)) return `Name must be at most ${maxLength ?? 50} characters`;
      if (!/^[a-zA-Z\s.\-']+$/.test(trimmed)) return "Only letters and spaces are allowed (no numbers or special characters)";
      if (pattern && !pattern.test(raw)) return allowedPatternMessage || "Use only the allowed characters";
      return null;

    case "alpha":
      if (trimmed.length < (minLength ?? 2)) return "Must be at least 2 characters";
      if (trimmed.length > (maxLength ?? 100)) return `Must be at most ${maxLength ?? 100} characters`;
      if (!/^[a-zA-Z\s,.\-'()]+$/.test(trimmed))
        return "Only letters and basic punctuation are allowed (no numbers or special characters)";
      if (pattern && !pattern.test(raw)) return allowedPatternMessage || "Use only the allowed characters";
      return null;

    case "cnic":
      if (typeof maxLength === "number" && raw.length > maxLength) return `Must be at most ${maxLength} characters`;
      return /^\d{5}-\d{7}-\d$/.test(trimmed) ? null : "Use format: XXXXX-XXXXXXX-X";

    case "otp":
      if (typeof maxLength === "number" && raw.length > maxLength) return `Must be at most ${maxLength} characters`;
      return /^\d{6}$/.test(trimmed) ? null : "OTP must be exactly 6 digits";

    case "percentage": {
      if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return "Enter a valid number";
      const n = parseFloat(trimmed);
      const lo = min ?? 0;
      const hi = max ?? 100;
      if (n < lo || n > hi) return `Must be between ${lo} and ${hi}`;
      return null;
    }

    case "year": {
      if (!/^\d{4}$/.test(trimmed)) return "Year must be exactly 4 digits";
      const n = parseInt(trimmed, 10);
      const now = new Date().getFullYear();
      const lo = min ?? 1950;
      const hi = max ?? now + 2;
      if (isNaN(n) || n < lo || n > hi)
        return `Enter a valid year (e.g. ${now})`;
      return null;
    }

    case "number":
    case "marks": {
      if (!/^\d+$/.test(trimmed)) return "Enter a valid number";
      const n = parseInt(trimmed, 10);
      if (min !== undefined && n < min) return `Must be at least ${min}`;
      if (max !== undefined && n > max) return `Must be at most ${max}`;
      return null;
    }

    case "textarea":
      if (pattern && !pattern.test(raw)) return allowedPatternMessage || "Use only the allowed characters";
      if (hasInjection(raw)) return "Invalid input: contains disallowed content";
      if (typeof maxLength === "number" && raw.length > maxLength) return `Must be at most ${maxLength} characters`;
      if (maxWords && wordCount(raw) > maxWords) return `Maximum ${maxWords} words allowed`;
      return null;

    case "text":
      if (pattern && !pattern.test(raw)) return allowedPatternMessage || "Use only the allowed characters";
      if (hasInjection(raw)) return "Invalid input: contains disallowed content";
      if (typeof minLength === "number" && trimmed.length < minLength) return `Must be at least ${minLength} characters`;
      if (typeof maxLength === "number" && raw.length > maxLength) return `Must be at most ${maxLength} characters`;
      return null;

    // select, date, file — only required check matters
    default:
      return null;
  }
}

/** Returns "weak" | "medium" | "strong" for a password string. */
export function passwordStrength(value) {
  if (!value || value.length < 6) return "weak";
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score <= 1 ? "weak" : score <= 2 ? "medium" : "strong";
}
