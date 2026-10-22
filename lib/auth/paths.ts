// The application uses hash navigation. Never send users to an arbitrary origin.
export function safeReturnPath(value: unknown) {
  return typeof value === 'string' && /^\/#(schedule|rankings|widgets|discover|profile)(\/[a-z]+)?$/.test(value) ? value : '/#schedule';
}
