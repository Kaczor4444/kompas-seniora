/**
 * Generate a random 6-character token for sharing lists
 * Uses lowercase letters and numbers (a-z, 0-9)
 * Example: "k7m9x2"
 */
export function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}
