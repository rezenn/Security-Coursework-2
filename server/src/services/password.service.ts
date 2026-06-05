import zxcvbn from 'zxcvbn';

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;   
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  feedback: string[];
  isAcceptable: boolean;       
  crackTime: string;
}

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export const assessPasswordStrength = (
  password: string,
  userInputs: string[] = []   
): PasswordStrengthResult => {
  const result = zxcvbn(password, userInputs);

  const labels: PasswordStrengthResult['label'][] = [
    'Very Weak',
    'Weak',
    'Fair',
    'Strong',
    'Very Strong',
  ];

  const feedback: string[] = [];
  if (result.feedback.warning) feedback.push(result.feedback.warning);
  feedback.push(...result.feedback.suggestions);

  return {
    score: result.score as 0 | 1 | 2 | 3 | 4,
    label: labels[result.score],
    feedback,
    isAcceptable: result.score >= 3,
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second as string,
  };
};

export const validatePasswordPolicy = (password: string): PasswordPolicyResult => {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  }

  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password cannot exceed ${PASSWORD_POLICY.maxLength} characters`);
  }

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    PASSWORD_POLICY.requireSpecial &&
    !new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)
  ) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
  }

  if (/^(.)\1+$/.test(password)) {
    errors.push('Password cannot be all the same character');
  }

  if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)+$/i.test(password)) {
    errors.push('Password cannot be a simple sequence');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const generateSecurePassword = (): string => {
  const chars = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%^&*',
  };

  const allChars = Object.values(chars).join('');
  let password = '';

  Object.values(chars).forEach((charSet) => {
    password += charSet[Math.floor(Math.random() * charSet.length)];
  });

  for (let i = password.length; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

export { PASSWORD_POLICY };