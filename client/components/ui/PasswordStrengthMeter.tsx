"use client";
import { useMemo } from "react";
import { getPasswordStrength, validatePasswordPolicy } from "@/lib/utils/password";
import { CheckCircle, XCircle } from "lucide-react";
import clsx from "clsx";

interface Props {
  password: string;
  userInputs?: string[];
}

export const PasswordStrengthMeter = ({ password, userInputs = [] }: Props) => {
  const strength = useMemo(() => getPasswordStrength(password, userInputs), [password, userInputs]);
  const errors = useMemo(() => validatePasswordPolicy(password), [password]);

  if (!password) return null;

  const segments = [0, 1, 2, 3, 4];

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {segments.map((s) => (
          <div
            key={s}
            className={clsx(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              s <= strength.score ? strength.barColor : "bg-slate-700",
            )}
          />
        ))}
      </div>

      {/* Label */}
      <p className={clsx("text-xs font-medium", strength.color)}>
        {strength.label}
        {strength.score >= 3 && password.length >= 12 && (
          <span className="text-slate-500 font-normal ml-1">— good to go</span>
        )}
      </p>

      {/* Policy checklist */}
      <div className="grid grid-cols-2 gap-1">
        {[
          { label: "12+ characters", pass: password.length >= 12 },
          { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
          { label: "Lowercase letter", pass: /[a-z]/.test(password) },
          { label: "Number", pass: /\d/.test(password) },
          { label: "Special character", pass: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password) },
        ].map(({ label, pass }) => (
          <div key={label} className="flex items-center gap-1">
            {pass ? (
              <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
            ) : (
              <XCircle size={12} className="text-slate-600 flex-shrink-0" />
            )}
            <span className={clsx("text-xs", pass ? "text-green-400" : "text-slate-500")}>{label}</span>
          </div>
        ))}
      </div>

      {/* zxcvbn warnings */}
      {strength.feedback.length > 0 && errors.length === 0 && (
        <p className="text-xs text-yellow-400">{strength.feedback[0]}</p>
      )}
    </div>
  );
};
