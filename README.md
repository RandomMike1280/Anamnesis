# Space of Sonder

A web app where a private, encrypted diary quietly becomes a public constellation. Write in a calm, intimate space, then look up at a shared sky made of everyone's inner weather.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion + Canvas API
- **Backend:** Supabase (Postgres + Auth + Realtime + RLS)
- **Encryption:** Web Crypto API (AES-GCM, client-side)
- **AI:** Google Gemini Flash Lite (structured output for mood analysis)

## Features

1. **Private Diary** — Write encrypted entries that never leave your device in plaintext
2. **AI Mood Analysis** — Gemini analyzes your recent entries to determine your emotional state
3. **Public Star** — Your mood becomes a colored star in the shared sky
4. **Star Sky** — Explore a constellation of anonymous emotional states
5. **Encrypted Messaging** — Connect with other stars through private messages
6. **Region Clustering** — Stars from similar regions cluster together

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor
3. Copy your project URL and anon key

### 3. Set Up Google AI

1. Get an API key from [Google AI Studio](https://aistudio.google.com)
2. Note: The model ID `gemini-2.0-flash-lite` may change — check Google AI Studio for the current Flash Lite model

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_google_api_key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── diary/             # Diary entries CRUD
│   ├── sky/               # Public star sky view
│   ├── messages/          # 1:1 messaging
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── diary/            # Diary-specific components
│   ├── sky/              # Star sky components
│   └── messages/         # Messaging components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase clients
│   ├── crypto/           # Encryption utilities
│   ├── ai/               # Gemini mood analysis
│   └── utils/            # General utilities
└── types/                 # TypeScript types
```

## How Encryption Works

All diary content and messages are encrypted **client-side** before being sent to Supabase:

1. User password is used to derive an AES-GCM encryption key via PBKDF2
2. Each entry/message is encrypted with a unique IV
3. Server only stores `salt.iv.ciphertext` — plaintext never touches the database
4. Only you can decrypt your data (password is never stored)

**Important:** If you lose your password, your data cannot be recovered.

## Mood Analysis Pipeline

1. After each new diary entry (or on schedule), the app fetches the last N entries
2. Entries are decrypted client-side
3. Plaintext is sent to Gemini Flash Lite for mood analysis
4. Gemini returns structured JSON: `{mood, confidence, color_hex}`
5. Your star's color updates to reflect your current mood

**Privacy Note:** While diary content stays encrypted in the database, it is temporarily sent to Google's API for analysis. Consider this in your threat model.

## Design Philosophy

- **Calm and intimate** — Generous whitespace, minimal chrome, warm accents
- **Vast and alive** — Subtle animations, smooth transitions, emotional color palette
- **Literary modern** — Serif headings + humanist sans body, not generic SaaS
- **Micro-interactions matter** — Every save, every star appearance feels intentional

## Build Order (for development)

1. ✅ Auth + encrypted diary CRUD + timeline
2. ✅ Gemini Flash Lite mood pipeline with structured output
3. ⏳ Star sky rendering + color mapping + animations
4. ⏳ Public profile (bio/quote/status) on star click
5. ⏳ Messaging
6. ⏳ Region-based clustering

## License

MIT
