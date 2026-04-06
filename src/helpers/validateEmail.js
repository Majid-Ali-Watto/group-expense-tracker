export function validateEmail(email) {
  // More strict email validation:
  // - At least 3 characters before @
  // - Domain must have at least 2 characters
  // - TLD must have at least 2 characters
  const emailPattern = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/
  return emailPattern.test(email)
}
