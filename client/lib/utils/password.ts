import zxcvbn from "zxcvbn";

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export interface StrengthResult {
  score: StrengthScore;
  label: string;
  color: string;
  barColor: string;
  feedback: string[];
  percentage: number;
}

const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const colors = ["text-red-400", "text-orange-400", "text-yellow-400", "text-blue-400", "text-green-400"];
const barColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];

export const getPasswordStrength = (password: string, userInputs: string[] = []): StrengthResult => {
  if (!password) return { score: 0, label: "Very Weak", color: colors[0], barColor: barColors[0], feedback: [], percentage: 0 };
  const r = zxcvbn(password, userInputs);
  const feedback: string[] = [];
  if (r.feedback.warning) feedback.push(r.feedback.warning);
  feedback.push(...r.feedback.suggestions);
  return {
    score: r.score as StrengthScore,
    label: labels[r.score],
    color: colors[r.score],
    barColor: barColors[r.score],
    feedback,
    percentage: (r.score + 1) * 20,
  };
};

export const validatePasswordPolicy = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 12) errors.push("At least 12 characters");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/\d/.test(password)) errors.push("One number");
  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) errors.push("One special character");
  return errors;
};
