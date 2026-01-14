/**
 * Generates a random coupon code
 * Format: XXX-XXXX (e.g., ABC-1234)
 * Uses uppercase letters and numbers for readability
 */
export function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars (I, O, 0, 1)
  
  // Generate first part (3 letters)
  let part1 = '';
  for (let i = 0; i < 3; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Generate second part (4 alphanumeric)
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${part1}-${part2}`;
}

/**
 * Validates and formats a coupon code
 * Ensures uppercase and proper format
 */
export function formatCouponCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Validates coupon code format
 * Allows letters, numbers, and hyphens
 */
export function isValidCouponCode(code: string): boolean {
  // Allow alphanumeric characters and hyphens, 3-50 characters
  const pattern = /^[A-Z0-9-]{3,50}$/;
  return pattern.test(code.toUpperCase());
}
