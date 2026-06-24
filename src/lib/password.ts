// Central password policy — used by every place that sets a password.

export const MIN_PASSWORD_LENGTH = 8;

/** Returns an Arabic error message if the password is too weak, else null. */
export function validatePassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`;
  }
  if (!/[A-Za-z]/.test(password)) {
    return "كلمة المرور لازم تحتوي على حرف واحد على الأقل";
  }
  if (!/[0-9]/.test(password)) {
    return "كلمة المرور لازم تحتوي على رقم واحد على الأقل";
  }
  return null;
}
