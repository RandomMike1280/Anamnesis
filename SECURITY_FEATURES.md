# Security & Growth Features Implementation Guide

## Overview

This implementation adds three major features:
1. **Star size grows with journal size** — stars in the sky box become larger and brighter as users write more diary entries
2. **Envelope encryption with separate PIN** — diary content is encrypted with a random key, which is itself encrypted with a user-defined PIN (separate from account password)
3. **TOTP authenticator app support** — optional 2FA using Google Authenticator, Authy, etc.

---

## 1. Star Size Growth

### How it works
- Each user's `entry_count` is stored in the `profiles` table
- Database triggers automatically increment/decrement the count when diary entries are created/deleted
- Stars scale logarithmically: 0 entries = size 2, 10 = ~3.5, 50 = ~5, 100+ = ~7
- Formula: `baseSize = 2 + Math.min(5, Math.log2(entryCount + 1) * 1.5)`

### Files changed
- `supabase-security-setup.sql` — adds `entry_count` column and triggers
- `types/index.ts` — adds `entry_count` to Star and UserProfile interfaces
- `app/sky/page.tsx` — fetches `entry_count` from profiles
- `components/sky/StarSky3D.tsx` — scales star size based on `entry_count`

### Database schema
```sql
ALTER TABLE profiles ADD COLUMN entry_count INTEGER DEFAULT 0;
-- Triggers auto-increment/decrement on diary_entries insert/delete
```

---

## 2. Envelope Encryption with PIN

### How it works

**Traditional approach (OLD):**
- Diary entries encrypted directly with user's account password
- Problem: changing password requires re-encrypting all entries

**Envelope encryption (NEW):**
- Generate a random **Data Encryption Key (DEK)** on signup
- Diary entries are encrypted with the DEK (fast, never changes)
- The DEK is encrypted with a **Key Encryption Key (KEK)** derived from user's PIN
- Stored: `encrypted_dek` in profiles table
- In memory: decrypted DEK (for current session)

**Benefits:**
- PIN is separate from account password (more secure)
- Changing PIN only requires re-encrypting the DEK (instant)
- Account password can be changed without touching diary data
- Supports TOTP 2FA (account security separate from diary encryption)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ User enters PIN                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  PBKDF2 (100k iter) │
         │  PIN → KEK          │
         └──────────┬──────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Decrypt encrypted   │◄─── Stored in DB
         │  DEK with KEK        │     (profiles.encrypted_dek)
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  DEK (in memory)     │◄─── Session only
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  Encrypt/decrypt diary   │
         │  entries with DEK        │
         └──────────────────────────┘
```

### Files created
- `lib/crypto/envelope.ts` — envelope encryption functions
  - `generateDEK()` — creates random 256-bit key
  - `encryptDEK(dek, pin)` — encrypts DEK with PIN-derived KEK
  - `decryptDEK(encrypted, pin)` — decrypts DEK
  - `encryptData(text, dek)` — encrypts diary content with DEK
  - `decryptData(encrypted, dek)` — decrypts diary content
  - `changePIN(encrypted, oldPIN, newPIN)` — re-encrypts DEK with new PIN
- `components/auth/PINSetup.tsx` — first-time PIN setup UI
- `supabase-security-setup.sql` — adds `encrypted_dek` column

### Migration path
1. Run `supabase-security-setup.sql` to add columns
2. Existing users: on next login, prompt for PIN setup
3. Generate DEK, encrypt with PIN, store `encrypted_dek`
4. New diary entries use envelope encryption
5. (Optional) background job to re-encrypt old entries with envelope system

### Database schema
```sql
ALTER TABLE profiles ADD COLUMN encrypted_dek TEXT;
```

---

## 3. TOTP Authenticator App Support

### How it works
- Uses RFC 6238 (Time-based One-Time Password)
- Pure Web Crypto API implementation (no external libraries)
- 6-digit codes, 30-second window, ±1 window grace period (90 seconds total)
- Works with Google Authenticator, Authy, 1Password, Microsoft Authenticator, etc.

### Flow
1. User enables 2FA in settings
2. Server generates random TOTP secret (base32-encoded, 160 bits)
3. QR code displayed (otpauth:// URI)
4. User scans with authenticator app
5. User enters 6-digit code to verify
6. Secret stored in `profiles.totp_secret`, `totp_enabled = true`
7. On login: after email/password, prompt for TOTP code
8. Verify code before granting access

### Files created
- `lib/crypto/totp.ts` — TOTP implementation
  - `generateTOTPSecret()` — creates random base32 secret
  - `generateTOTPUri(secret, email)` — creates otpauth:// URI for QR codes
  - `verifyTOTP(code, secret)` — validates 6-digit code (±1 window)
  - `getCurrentTOTP(secret)` — generates current code (for testing)
- `components/auth/TOTPSetup.tsx` — 2FA setup UI with QR code
- `supabase-security-setup.sql` — adds `totp_secret` and `totp_enabled` columns

### Database schema
```sql
ALTER TABLE profiles 
  ADD COLUMN totp_secret TEXT,
  ADD COLUMN totp_enabled BOOLEAN DEFAULT false;
```

### Security notes
- TOTP secret must be stored securely (only accessible to user)
- Use HTTPS in production (TOTP secrets are sensitive)
- Provide backup codes for account recovery
- Consider rate-limiting TOTP verification attempts

---

## Setup Instructions

### 1. Run SQL migrations
```bash
# In Supabase SQL Editor:
1. Run supabase-security-setup.sql
2. Verify columns exist:
   - profiles.entry_count
   - profiles.encrypted_dek
   - profiles.totp_secret
   - profiles.totp_enabled
```

### 2. Update auth flow
Modify `app/auth/page.tsx` or create middleware to:
- On signup: redirect to PIN setup
- On login: check if `encrypted_dek` exists
  - If not: redirect to PIN setup
  - If yes: prompt for PIN, decrypt DEK
- If `totp_enabled = true`: prompt for TOTP code after password

### 3. Update diary page
Modify `app/diary/page.tsx` to:
- Use envelope encryption functions instead of direct encryption
- Store DEK in memory (React state or context)
- Clear DEK on logout

### 4. Test flow
1. Create new account
2. Set up PIN (6+ digits)
3. Enable 2FA (scan QR code)
4. Write diary entry
5. Log out, log back in
6. Enter password → TOTP code → PIN
7. Verify diary entry decrypts correctly

---

## Code Examples

### Using envelope encryption in diary page
```typescript
import { encryptData, decryptData, decryptDEK } from '@/lib/crypto/envelope';

// On login (after PIN entered)
const dek = await decryptDEK(profile.encrypted_dek, pin);
setDEK(dek); // Store in state

// Saving entry
const encrypted = await encryptData(content, dek);
await supabase.from('diary_entries').insert({ encrypted_content: encrypted });

// Loading entries
const decrypted = await decryptData(entry.encrypted_content, dek);
```

### Changing PIN
```typescript
import { changePIN } from '@/lib/crypto/envelope';

const newEncryptedDEK = await changePIN(
  profile.encrypted_dek,
  oldPIN,
  newPIN
);

await supabase.from('profiles')
  .update({ encrypted_dek: newEncryptedDEK })
  .eq('id', userId);
```

### Verifying TOTP on login
```typescript
import { verifyTOTP } from '@/lib/crypto/totp';

// After password verification
if (profile.totp_enabled) {
  const code = prompt('Enter 6-digit code from authenticator app');
  const isValid = await verifyTOTP(code, profile.totp_secret);
  if (!isValid) {
    alert('Invalid code');
    return;
  }
}
```

---

## Security Considerations

1. **PIN storage:** Never store PIN in localStorage or database (only in memory for session)
2. **DEK storage:** Only encrypted DEK is stored (with PIN-derived KEK)
3. **TOTP secret:** Stored encrypted or in secure storage in production
4. **Session management:** Clear DEK from memory on logout/timeout
5. **Backup codes:** Implement recovery mechanism if user loses authenticator device
6. **Rate limiting:** Limit PIN/TOTP attempts to prevent brute force
7. **HTTPS:** Required in production to protect PIN/TOTP in transit

---

## Testing Checklist

- [ ] Star size increases as diary entries are added
- [ ] Star size decreases when entries are deleted
- [ ] PIN setup flow works on first login
- [ ] Diary entries encrypt/decrypt with DEK
- [ ] PIN change doesn't break existing entries
- [ ] TOTP QR code scans correctly
- [ ] TOTP codes verify successfully (±1 window)
- [ ] Login flow: password → TOTP → PIN
- [ ] Logout clears DEK from memory
- [ ] Wrong PIN shows error (doesn't expose encrypted data)
