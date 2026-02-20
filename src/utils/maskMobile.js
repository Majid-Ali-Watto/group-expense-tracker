/**
 * Masks a mobile number for display.
 * First 2 and last 2 digits are visible; all middle digits are replaced with *.
 * e.g. 03001234567 → 03*******67
 */
export function maskMobile(mobile) {
  if (!mobile || mobile.length < 4) return mobile
  return mobile.slice(0, 2) + '*'.repeat(mobile.length - 4) + mobile.slice(-2)
}
