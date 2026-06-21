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

/**
 * Validates a value based on its semantic type.
 * Returns an error string or null if valid.
 *
 * Supported types: email, phone, password, confirm-password, name, alpha,
 *   cnic, otp, percentage, year, number, marks, text, textarea, select,
 *   date, file
 */
export function validate(type, value, { required = false, compareValue, min, max, maxWords } = {}) {
  const empty = isEmpty(value);

  if (empty) return required ? "This field is required" : null;

  switch (type) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? null
        : "Enter a valid email address";

    case "phone": {
      const clean = String(value).replace(/[\s\-()+]/g, "");
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
      if (value.trim().length < 2) return "Name must be at least 2 characters";
      if (value.trim().length > 50) return "Name must be at most 50 characters";
      if (!/^[a-zA-Z\s.\-']+$/.test(value.trim())) return "Only letters and spaces are allowed (no numbers or special characters)";
      return null;

    case "alpha":
      if (value.trim().length < 2) return "Must be at least 2 characters";
      if (!/^[a-zA-Z\s,.\-'()]+$/.test(value.trim()))
        return "Only letters and basic punctuation are allowed (no numbers or special characters)";
      return null;

    case "cnic":
      return /^\d{5}-\d{7}-\d$/.test(value) ? null : "Use format: XXXXX-XXXXXXX-X";

    case "otp":
      return /^\d{6}$/.test(value) ? null : "OTP must be exactly 6 digits";

    case "percentage": {
      const n = parseFloat(value);
      if (isNaN(n)) return "Enter a valid number";
      const lo = min ?? 0;
      const hi = max ?? 100;
      if (n < lo || n > hi) return `Must be between ${lo} and ${hi}`;
      return null;
    }

    case "year": {
      const n = parseInt(value, 10);
      const now = new Date().getFullYear();
      if (isNaN(n) || n < 1950 || n > now + 2)
        return `Enter a valid year (e.g. ${now})`;
      return null;
    }

    case "number":
    case "marks": {
      const n = parseFloat(value);
      if (isNaN(n)) return "Enter a valid number";
      if (min !== undefined && n < min) return `Must be at least ${min}`;
      if (max !== undefined && n > max) return `Must be at most ${max}`;
      return null;
    }

    case "textarea":
      if (hasInjection(value)) return "Invalid input: contains disallowed content";
      if (maxWords && wordCount(value) > maxWords) return `Maximum ${maxWords} words allowed`;
      return null;

    case "text":
      if (hasInjection(value)) return "Invalid input: contains disallowed content";
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
