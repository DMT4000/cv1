export function redactPII(input: string): string {
  if (!input) return input;
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phoneRegex = /\+?\d[\d\s().-]{7,}\d/g;
  return input.replace(emailRegex, '[redacted-email]').replace(phoneRegex, '[redacted-phone]');
}


