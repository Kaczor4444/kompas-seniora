import { randomBytes } from 'crypto';

// 12 hex chars = 48 bits of entropy = ~281 trillion combinations
// Math.random() (previous) had 36^6 = 2.1B — brute-forceable in hours
export function generateToken(): string {
  return randomBytes(6).toString('hex');
}
