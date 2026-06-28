import zxcvbn from "zxcvbn";

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  feedback: string[];
  crackTime: string;
}

const POLICY = {
  minLength: 12,
  maxLength: 128,
};

export const validatePasswordPolicy = (
  password: string,
): PasswordPolicyResult => {
  const errors: string[] = [];
  if (password.length < POLICY.minLength)
    errors.push(`Password must be at least ${POLICY.minLength} characters`);
  if (password.length > POLICY.maxLength)
    errors.push(`Password cannot exceed ${POLICY.maxLength} characters`);
  if (!/[A-Z]/.test(password))
    errors.push("Must contain at least one uppercase letter");
  if (!/[a-z]/.test(password))
    errors.push("Must contain at least one lowercase letter");
  if (!/\d/.test(password)) errors.push("Must contain at least one number");
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password))
    errors.push("Must contain at least one special character");
  return { valid: errors.length === 0, errors };
};

export const assessPasswordStrength = (
  password: string,
  userInputs: string[] = [],
): PasswordStrengthResult => {
  const r = zxcvbn(password, userInputs);
  const labels: PasswordStrengthResult["label"][] = [
    "Very Weak",
    "Weak",
    "Fair",
    "Strong",
    "Very Strong",
  ];
  const feedback: string[] = [];
  if (r.feedback.warning) feedback.push(r.feedback.warning);
  feedback.push(...r.feedback.suggestions);
  return {
    score: r.score as 0 | 1 | 2 | 3 | 4,
    label: labels[r.score],
    feedback,
    crackTime: r.crack_times_display
      .offline_slow_hashing_1e4_per_second as string,
  };
};
