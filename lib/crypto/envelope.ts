/**
 * Envelope encryption implementation
 *
 * User data is encrypted with a random Data Encryption Key (DEK).
 * The DEK is then encrypted with a Key Encryption Key (KEK) derived from the user's PIN.
 * This allows changing the PIN without re-encrypting all data.
 *
 * Flow:
 * 1. On signup: Generate random DEK, derive KEK from PIN, encrypt DEK with KEK
 * 2. On data write: Encrypt data with DEK
 * 3. On data read: Decrypt DEK with KEK (from PIN), then decrypt data with DEK
 * 4. On PIN change: Decrypt DEK with old KEK, encrypt DEK with new KEK
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const ITERATIONS = 100000;
const DEK_LENGTH = 32; // 256 bits

/**
 * Generate a random Data Encryption Key (DEK)
 */
export function generateDEK(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(DEK_LENGTH));
}

/**
 * Derive Key Encryption Key (KEK) from PIN using PBKDF2
 */
async function deriveKEK(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Import DEK as a CryptoKey for data encryption/decryption
 */
async function importDEK(dek: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    dek,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt the DEK with the KEK (derived from PIN)
 * Returns base64-encoded string: salt.iv.encryptedDEK
 */
export async function encryptDEK(dek: Uint8Array, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const kek = await deriveKEK(pin, salt);

  const encryptedDEK = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    kek,
    dek
  );

  // Combine salt + iv + encryptedDEK
  const combined = new Uint8Array(salt.length + iv.length + encryptedDEK.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedDEK), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt the DEK using the KEK (derived from PIN)
 * Expects base64-encoded string: salt.iv.encryptedDEK
 */
export async function decryptDEK(encryptedDEKString: string, pin: string): Promise<Uint8Array> {
  const combined = Uint8Array.from(atob(encryptedDEKString), c => c.charCodeAt(0));

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encryptedDEK = combined.slice(SALT_LENGTH + IV_LENGTH);

  const kek = await deriveKEK(pin, salt);

  const dekBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    kek,
    encryptedDEK
  );

  return new Uint8Array(dekBuffer);
}

/**
 * Encrypt plaintext data using the DEK
 * Returns base64-encoded string: iv.ciphertext
 */
export async function encryptData(plaintext: string, dek: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await importDEK(dek);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine iv + ciphertext (no salt needed - DEK is already random)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt ciphertext data using the DEK
 * Expects base64-encoded string: iv.ciphertext
 */
export async function decryptData(encryptedData: string, dek: Uint8Array): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const key = await importDEK(dek);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Change PIN: decrypt DEK with old PIN, re-encrypt with new PIN
 */
export async function changePIN(
  encryptedDEKString: string,
  oldPIN: string,
  newPIN: string
): Promise<string> {
  const dek = await decryptDEK(encryptedDEKString, oldPIN);
  return encryptDEK(dek, newPIN);
}

/**
 * Encode DEK as base64 string for storage in memory
 */
export function encodeDEK(dek: Uint8Array): string {
  return btoa(String.fromCharCode(...dek));
}

/**
 * Decode DEK from base64 string
 */
export function decodeDEK(encoded: string): Uint8Array {
  return Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
}
