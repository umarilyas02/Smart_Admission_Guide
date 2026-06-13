"use client";

import { useState } from "react";
import { validate, passwordStrength as getStrength } from "@/lib/validators";

// Immutable structural classes always present
const IMMUTABLE = "w-full border focus:ring-2 focus:outline-none transition";

// Default layout — overridden entirely by inputClassName prop
const DEFAULT_LAYOUT = "px-4 py-2.5 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white";

const STATE_CLASSES = {
  default: "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
  error:   "border-red-400   focus:ring-red-200   focus:border-red-400   bg-red-50/50",
  valid:   "border-green-400 focus:ring-green-200 focus:border-green-400",
};

function isValueEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

/**
 * ValidatedInput — a single reusable input component with built-in validation.
 *
 * Prop: type — determines validation rules AND the rendered element.
 *   text | name | email | phone | cnic
 *   password | confirm-password
 *   otp
 *   number | percentage | marks | year
 *   textarea | select | date | file
 *
 * For "select": pass option elements as children OR pass options=[{value,label}].
 * For "confirm-password": pass compareValue prop with the original password.
 * For "number/marks": pass min/max to bound the range.
 * For number inputs with a trailing unit symbol: pass suffix="%".
 * For password: pass showPasswordStrength to show a strength bar.
 */
export default function ValidatedInput({
  // Semantic type — drives both validation and rendered element
  type = "text",

  // Standard field props
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  name,
  id,
  autoComplete,

  // Styling
  className = "",       // wrapper div
  inputClassName,       // fully replaces DEFAULT_LAYOUT when provided

  // UX helpers
  hint,
  suffix,               // trailing unit inside number inputs (e.g. "%")

  // Number bounds
  min,
  max,
  step,

  // Textarea
  rows = 3,

  // Select
  options,              // [{value, label}] — alternative to children
  children,             // <option> elements passed as children for select

  // Password
  showPasswordStrength = false,

  // Confirm password
  compareValue,

  // Text length
  maxLength,
}) {
  const [touched, setTouched] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const fieldId =
    id ||
    name ||
    (label ? `field-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  const error   = touched ? validate(type, value, { required, compareValue, min, max }) : null;
  const isValid = touched && !error && !isValueEmpty(value);

  const stateKey = error ? "error" : isValid ? "valid" : "default";
  const layout   = inputClassName ?? DEFAULT_LAYOUT;
  const cls      = `${IMMUTABLE} ${STATE_CLASSES[stateKey]} ${layout}`.trim();

  const handleBlur = (e) => {
    setTouched(true);
    onBlur?.(e);
  };

  const strength = showPasswordStrength && value ? getStrength(value) : null;

  // ── Eye toggle button (shared by password + confirm-password) ───────────────
  const eyeToggle = (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShowPwd((s) => !s)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
    >
      {showPwd ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  // ── Render the right element ─────────────────────────────────────────────────
  let inputEl;

  if (type === "textarea") {
    inputEl = (
      <textarea
        id={fieldId} name={name} value={value ?? ""}
        onChange={onChange} onBlur={handleBlur}
        placeholder={placeholder} required={required} disabled={disabled}
        rows={rows} autoComplete={autoComplete}
        className={`${cls} resize-none`}
      />
    );
  } else if (type === "select") {
    inputEl = (
      <div className="relative">
        <select
          id={fieldId} name={name} value={value ?? ""}
          onChange={onChange} onBlur={handleBlur}
          required={required} disabled={disabled}
          className={`${cls} appearance-none pr-10`}
        >
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))
            : children}
        </select>
        {/* Chevron */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  } else if (type === "password" || type === "confirm-password") {
    inputEl = (
      <div className="relative">
        <input
          id={fieldId} name={name}
          type={showPwd ? "text" : "password"}
          value={value ?? ""} onChange={onChange} onBlur={handleBlur}
          placeholder={placeholder} required={required} disabled={disabled}
          autoComplete={autoComplete} maxLength={maxLength}
          className={`${cls} pr-10`}
        />
        {eyeToggle}
      </div>
    );
  } else if (type === "otp") {
    inputEl = (
      <input
        id={fieldId} name={name} type="text" inputMode="numeric"
        value={value ?? ""} onChange={onChange} onBlur={handleBlur}
        placeholder={placeholder || "000000"} required={required} disabled={disabled}
        maxLength={maxLength || 6} autoComplete="one-time-code"
        className={`${cls} text-center text-2xl tracking-widest`}
      />
    );
  } else if (["number", "percentage", "marks", "year"].includes(type)) {
    const resolvedMax  = max  ?? (type === "percentage" ? 100 : undefined);
    const resolvedMin  = min  ?? 0;
    const resolvedStep = step ?? (type === "percentage" ? 0.1 : 1);
    inputEl = (
      <div className="relative">
        <input
          id={fieldId} name={name} type="number"
          value={value ?? ""} onChange={onChange} onBlur={handleBlur}
          placeholder={placeholder} required={required} disabled={disabled}
          min={resolvedMin} max={resolvedMax} step={resolvedStep}
          autoComplete={autoComplete}
          className={suffix ? `${cls} pr-10` : cls}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
    );
  } else if (type === "date") {
    inputEl = (
      <input
        id={fieldId} name={name} type="date"
        value={value ?? ""} onChange={onChange} onBlur={handleBlur}
        required={required} disabled={disabled} min={min} max={max}
        autoComplete={autoComplete} className={cls}
      />
    );
  } else if (type === "file") {
    inputEl = (
      <input
        id={fieldId} name={name} type="file"
        onChange={onChange} onBlur={handleBlur}
        required={required} disabled={disabled} className={cls}
      />
    );
  } else {
    // text, name, email, phone, cnic, and any other string type
    const htmlType =
      type === "email" ? "email" :
      type === "phone" ? "tel"   : "text";
    inputEl = (
      <input
        id={fieldId} name={name} type={htmlType}
        value={value ?? ""} onChange={onChange} onBlur={handleBlur}
        placeholder={placeholder} required={required} disabled={disabled}
        maxLength={maxLength} autoComplete={autoComplete} className={cls}
      />
    );
  }

  // ── Compose the wrapper ──────────────────────────────────────────────────────
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      {inputEl}

      {/* Password strength meter */}
      {strength && (
        <div className="mt-1.5">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                strength === "strong" ? "bg-green-500 w-full"  :
                strength === "medium" ? "bg-yellow-400 w-2/3"  : "bg-red-400 w-1/3"
              }`}
            />
          </div>
          <p className={`text-xs mt-0.5 capitalize font-medium ${
            strength === "strong" ? "text-green-600"  :
            strength === "medium" ? "text-yellow-600" : "text-red-500"
          }`}>
            {strength} password
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Hint — only shown when no error */}
      {!error && hint && (
        <p className="text-gray-400 text-xs mt-1">{hint}</p>
      )}
    </div>
  );
}
