/**
 * TOTP (Time-based One-Time Password) implementation
 * Implements RFC 6238 using the Web Crypto API (no external libraries)
 */

/**
 * Generate a random TOTP secret (base32-encoded, 20 bytes = 160 bits)
 */
export function generateTOTPSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(bytes);
}

/**
 * Generate an otpauth:// URI for QR code scanning
 */
export function generateTOTPUri(secret: string, email: string, issuer = 'Sky of Sorrow'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Get the current TOTP counter (30-second window)
 */
function getTOTPCounter(forTime?: number): number {
  const time = forTime ?? Date.now();
  return Math.floor(time / 1000 / 30);
}

/**
 * Compute HOTP value for a given secret and counter
 */
async function computeHOTP(secret: string, counter: number): Promise<string> {
  const keyBytes = base32Decode(secret);

  // Pack counter as big-endian 8-byte integer
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterView.setUint32(0, high, false);
  counterView.setUint32(4, low, false);

  // HMAC-SHA1
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const hmacBuffer = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hmac = new Uint8Array(hmacBuffer);

  // Dynamic truncation
  const offset = hmac[19] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 1000000).padStart(6, '0');
}

/**
 * Verify a TOTP token. Accepts current window ± 1 (90 seconds grace).
 */
export async function verifyTOTP(token: string, secret: string): Promise<boolean> {
  const counter = getTOTPCounter();
  for (const delta of [-1, 0, 1]) {
    const expected = await computeHOTP(secret, counter + delta);
    if (expected === token.trim()) return true;
  }
  return false;
}

/**
 * Generate the current TOTP token (for testing / display)
 */
export async function getCurrentTOTP(secret: string): Promise<string> {
  return computeHOTP(secret, getTOTPCounter());
}

// --- Base32 helpers (RFC 4648, no padding needed for TOTP) ---

const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += B32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += B32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Uint8Array {
  const str = input.toUpperCase().replace(/=+$/, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of str) {
    const idx = B32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}
