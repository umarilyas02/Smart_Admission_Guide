import { admissionFormSections } from "@/lib/admission-form-schema";
import { validate } from "@/lib/validators";

const allFields = admissionFormSections.flatMap((section) => section.fields);

function isValidSelectValue(field, value) {
  return Array.isArray(field.options) && field.options.includes(value);
}

function validateCrossFieldRules(formData, errors) {
  if (formData?.sameAsPermanent === "No" && !String(formData?.mailingAddress || "").trim()) {
    errors.mailingAddress = "Mailing address is required when it is different from permanent address";
  }

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

  const birthYear = formData?.dateOfBirth ? new Date(formData.dateOfBirth).getFullYear() : null;
  const matricYear = formData?.matricYear ? Number(formData.matricYear) : null;
  const interYear = formData?.interYear ? Number(formData.interYear) : null;
  const currentYear = new Date().getFullYear();

  if (birthYear && matricYear) {
    const ageAtMatric = matricYear - birthYear;
    if (ageAtMatric < 12) {
      errors.matricYear = "Matric passing year must be at least 12 years after date of birth";
    }
    if (matricYear > currentYear + 1) {
      errors.matricYear = "Matric passing year is too far in the future";
    }
  }

  if (birthYear && interYear) {
    const ageAtInter = interYear - birthYear;
    if (ageAtInter < 14) {
      errors.interYear = "Intermediate passing year must be at least 14 years after date of birth";
    }
  }

  if (matricYear && interYear && interYear < matricYear + 1) {
    errors.interYear = "Intermediate passing year must be after matric passing year";
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
