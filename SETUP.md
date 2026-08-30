# Space of Sonder - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to the SQL Editor
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Run the SQL to create tables, policies, and triggers
5. Go to Settings → API to get your project credentials

### 3. Set Up Google AI

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API key" and create a new key
3. Note: Check for the latest Flash Lite model ID (currently `gemini-2.0-flash-lite`)

### 4. Configure Environment Variables

Create `.env.local` in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Feature Overview

### ✅ Completed
- Project structure and configuration
- Authentication (Supabase Auth)
- Client-side encryption (AES-GCM)
- Diary CRUD with encrypted storage
- AI mood analysis (Gemini Flash Lite)
- Star sky visualization with Canvas API
- Public profiles with mood-based star colors
- Encrypted messaging system
- Region-based star clustering
- Real-time updates (Supabase Realtime)

### 🎨 Design Features
- Dark theme with deep navy background (#0a0e1a)
- Mood-based color palette (gold, blue, violet, teal)
- Framer Motion animations
- Canvas-based star rendering with glow effects
- Responsive UI components

### 🔐 Privacy Features
- All diary entries encrypted client-side before storage
- Password-based key derivation (PBKDF2)
- Server never sees plaintext content
- Row-Level Security (RLS) in Supabase
- Encrypted messaging between users

## Architecture

### Authentication Flow
1. User signs up with email/password
2. Supabase creates auth user + profile (via trigger)
3. Password is used to derive encryption key (never stored)
4. User can now write encrypted entries

### Diary Entry Flow
1. User writes entry in textarea
2. Content encrypted with AES-GCM (user's password-derived key)
3. Encrypted content sent to Supabase
4. Entry stored with format: `base64(salt + iv + ciphertext)`
5. On read: fetch encrypted content, decrypt client-side

### Mood Analysis Flow
1. User clicks "Analyze Mood" or saves new entry
2. Last N entries fetched and decrypted
3. Plaintext sent to Gemini Flash Lite API
4. AI returns structured JSON: `{mood, confidence, color_hex}`
5. Profile updated with new mood state
6. Star color updates on the public sky

### Star Sky Flow
1. Fetch all profiles with mood data
2. Generate star positions (region-based clustering)
3. Render on Canvas with glow effects
4. Real-time updates via Supabase subscriptions
5. Click star → show profile modal

## File Structure

```
├── app/
│   ├── api/mood/           # Mood analysis API endpoint
│   ├── auth/               # Sign in/up page
│   ├── diary/              # Private diary interface
│   ├── messages/           # Encrypted messaging
│   ├── sky/                # Public star constellation
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Loading.tsx
│   │   └── Textarea.tsx
│   └── sky/
│       └── StarSky.tsx     # Canvas star renderer
├── lib/
│   ├── ai/
│   │   └── mood-analysis.ts    # Gemini integration
│   ├── crypto/
│   │   └── encryption.ts       # AES-GCM encryption
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   └── server.ts           # Server client
│   └── utils/
│       └── index.ts            # Utilities
├── types/
│   ├── index.ts            # App types
│   └── database.ts         # Supabase types
└── supabase-schema.sql     # Database schema
```

## Important Notes

### Security Considerations

**Password Recovery**: There is NO password recovery. If a user loses their password, their diary entries cannot be decrypted. This is by design for maximum privacy.

**AI Privacy**: While entries are encrypted in the database, plaintext is temporarily sent to Google's Gemini API for mood analysis. Users should be aware of this.

**Key Derivation**: Uses PBKDF2 with 100,000 iterations. Consider upgrading to Argon2 for production.

### Mood Analysis

The AI analyzes the last 5 diary entries (configurable) to determine:
- Overall mood: happy, sad, struggling, or hopeful
- Confidence score (0.0 - 1.0)
- Representative color (hex)

This runs:
- Manually via "Analyze Mood" button
- Automatically after saving a new entry (optional)

### Star Positioning

Stars are positioned based on region using a deterministic hash function. Users from the same region cluster together. For a production app, consider:
- Real geolocation with user permission
- Privacy-preserving location clustering
- More sophisticated 3D positioning

## Customization

### Colors
Edit `tailwind.config.ts` to change mood colors:
```typescript
colors: {
  'star-gold': '#f4d03f',    // happy
  'star-blue': '#7eb4e2',    // sad
  'star-violet': '#9b59b6',  // struggling
  'star-teal': '#48c9b0',    // hopeful
}
```

### Fonts
Edit `app/layout.tsx` to change fonts. Currently using Inter for body text. Consider adding a display serif font like Fraunces or Cormorant.

### Animation Speed
Edit `components/sky/StarSky.tsx`:
- Change `time += 0.01` to adjust twinkle speed
- Modify glow radius in the gradient setup

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

Add environment variables in Vercel dashboard.

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_API_KEY`

## Troubleshooting

### "Failed to decrypt" errors
- User entered wrong password
- Entry was encrypted with a different password
- Encryption format changed between versions

### Stars not appearing
- Users must have completed mood analysis
- Check Supabase RLS policies are correctly set
- Verify profiles table has mood data

### Mood analysis fails
- Check Google API key is valid
- Verify model ID is current (`gemini-2.0-flash-lite`)
- Ensure entries are properly decrypted before analysis

## Next Steps

### Recommended Improvements
1. Add profile editing page
2. Implement search/filter for diary entries
3. Add export functionality (encrypted backup)
4. Enhance star clustering algorithm
5. Add notification system for new messages
6. Implement "mood history" visualization
7. Add social features (reactions, shared quotes)
8. Improve mobile responsive design
9. Add dark/light theme toggle
10. Implement rate limiting on mood analysis

### Production Readiness
- [ ] Add proper error boundaries
- [ ] Implement analytics
- [ ] Add comprehensive testing
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Add rate limiting
- [ ] Implement CSRF protection
- [ ] Add input sanitization
- [ ] Set up CI/CD pipeline
- [ ] Add SEO optimization
- [ ] Implement caching strategy

## License

MIT - See LICENSE file
