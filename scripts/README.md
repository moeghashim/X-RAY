# Scripts

This directory contains utility scripts for managing the application.

## cleanup-errors.ts

Cleans up old error messages from the database that are related to:
- Old Gemini API errors (from before the OpenAI migration)
- Temperature parameter errors (from GPT-5-mini migration)

### Usage

**Option 1: Using npm script (recommended)**
```bash
pnpm cleanup:errors
```

**Option 2: Using tsx directly**
```bash
pnpm tsx scripts/cleanup-errors.ts
```

**Option 3: Using Convex CLI directly**
```bash
npx convex run items:cleanupOldErrors
```

### Requirements

- `VITE_CONVEX_URL` or `CONVEX_URL` environment variable must be set
- The script will automatically load from `.env.local` if it exists
- You must be authenticated with Convex (run `npx convex dev` first)

### What it does

The script calls the `cleanupOldErrors` mutation which:
1. Scans all items in the database
2. Identifies errors related to Gemini API or temperature parameter issues
3. Clears those error messages (sets `error` field to `undefined`)
4. Returns the number of items cleaned

### Safety

The cleanup function is designed to be safe and only matches specific error patterns:
- Gemini errors: Contains "gemini" or the Gemini API domain
- Temperature errors: Must match the exact OpenAI error pattern containing "temperature", "does not support", "0.7", and "with this model"

This prevents accidental deletion of valid errors that might contain "0.7" for other reasons.

