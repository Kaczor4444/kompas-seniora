import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Admin Cookie Authentication with HMAC signing.
 *
 * ATTACK PREVENTED:
 * Without signing, the cookie "admin-auth=true" is plain text.
 * An attacker can open DevTools → Application → Cookies → set admin-auth=true
 * and gain full admin access without knowing the password.
 *
 * FIX:
 * We sign the cookie value with HMAC-SHA256 using ADMIN_SECRET.
 * The cookie becomes "admin-auth=true.HMAC_HEX".
 * Forging it without the secret produces a different HMAC → rejected.
 */

const SEPARATOR = '.'

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD
  if (!secret) {
    // Hard fail in production — never allow unsigned cookies
    throw new Error('ADMIN_SECRET or ADMIN_PASSWORD must be set in environment')
  }
  return secret
}

/**
 * Sign a cookie value with HMAC-SHA256.
 * Returns "value.hmachex"
 */
export function signCookie(value: string): string {
  const secret = getSecret()
  const mac = createHmac('sha256', secret).update(value).digest('hex')
  return `${value}${SEPARATOR}${mac}`
}

/**
 * Verify a signed cookie value.
 * Returns the original value if valid, null if tampered or invalid.
 *
 * Uses timingSafeEqual to prevent timing attacks on the HMAC comparison.
 */
export function verifyCookie(signedValue: string): string | null {
  if (!signedValue || typeof signedValue !== 'string') return null

  const separatorIndex = signedValue.lastIndexOf(SEPARATOR)
  if (separatorIndex === -1) return null

  const value = signedValue.slice(0, separatorIndex)
  const providedMac = signedValue.slice(separatorIndex + 1)

  if (!value || !providedMac) return null

  // Compute expected HMAC
  let secret: string
  try {
    secret = getSecret()
  } catch {
    return null
  }

  const expectedMac = createHmac('sha256', secret).update(value).digest('hex')

  // Timing-safe comparison
  try {
    const providedBuf = Buffer.from(providedMac, 'hex')
    const expectedBuf = Buffer.from(expectedMac, 'hex')

    if (providedBuf.length !== expectedBuf.length) return null

    if (!timingSafeEqual(providedBuf, expectedBuf)) return null
  } catch {
    return null
  }

  return value
}

/**
 * Check if a signed admin cookie is valid and equals the expected value.
 * Convenience wrapper for the most common use-case.
 */
export function isValidAdminCookie(signedValue: string | undefined, expectedValue = 'true'): boolean {
  if (!signedValue) return false
  const value = verifyCookie(signedValue)
  return value === expectedValue
}
