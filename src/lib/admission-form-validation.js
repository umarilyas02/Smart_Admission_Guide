import { admissionFormSections } from "@/lib/admission-form-schema";
import { validate } from "@/lib/validators";

const allFields = admissionFormSections.flatMap((section) => section.fields);

function isValidSelectValue(field, value) {
  return Array.isArray(field.options) && field.options.includes(value);
}

function validateCrossFieldRules(formData, errors) {
  const matricObtained = formData?.matricObtained;
  const matricTotal = formData?.matricTotal;
  if (
    matricObtained !== undefined && matricObtained !== null && matricObtained !== "" &&
    matricTotal !== undefined && matricTotal !== null && matricTotal !== ""
  ) {
    const obtained = Number(matricObtained);
    const total = Number(matricTotal);
    if (Number.isFinite(obtained) && Number.isFinite(total) && obtained > total) {
      errors.matricObtained = "Obtained marks cannot exceed total marks";
    }
  }

  const interObtained = formData?.interObtained;
  const interTotal = formData?.interTotal;
  if (
    interObtained !== undefined && interObtained !== null && interObtained !== "" &&
    interTotal !== undefined && interTotal !== null && interTotal !== ""
  ) {
    const obtained = Number(interObtained);
    const total = Number(interTotal);
    if (Number.isFinite(obtained) && Number.isFinite(total) && obtained > total) {
      errors.interObtained = "Obtained marks cannot exceed total marks";
    }
  }
}

export function validateAdmissionForm(formData = {}) {
  const errors = {};

  for (const field of allFields) {
    const value = formData?.[field.id];

    if (field.type === "select" && value && !isValidSelectValue(field, value)) {
      errors[field.id] = "Select a valid option";
      continue;
    }

    const error = validate(field.type, value, field);
    if (error) {
      errors[field.id] = error;
    }
  }

  validateCrossFieldRules(formData, errors);

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
