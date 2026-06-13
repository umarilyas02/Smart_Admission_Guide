"use client";

import ValidatedInput from "./ValidatedInput";

/** Thin wrapper kept for backwards-compatibility. Use ValidatedInput directly. */
export default function PasswordInput({ label, value, onChange, placeholder = "Enter password", required = false, className = "" }) {
  return (
    <ValidatedInput
      type="password"
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={className}
    />
  );
}
