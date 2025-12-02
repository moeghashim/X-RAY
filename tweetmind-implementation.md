## TweetMind Implementation Blueprint

This document turns the approved TweetMind plan into actionable implementation guidance for engineering teams. It captures the current UX, Convex data design, API surface, frontend wiring, and deployment steps for both the Vercel web app and the Expo (iOS-first) mobile app.

### 1. Current UI & User Flows (Web @ `http://localhost:3002`)

The existing Vite/React prototype already expresses the end-to-end flow the new stack must support:

1. **Home View**
   - **Add Content** card on the left displays a textarea (`Paste tweet link or content to begin…`), three category chips (Learning, News, Inspiration), and the primary **Analyze Content** button.
   - **Browse Library** column on the right contains three CTA cards (`Learning Paths`, `News Briefings`, `Inspiration Board`) with item counts and navigation arrows.
2. **Results View**
   - Activated when a Browse Library card is clicked or immediately after Analyze.
   - Sticky header provides `Back to Home` and desktop category tabs; bottom navigation replicates tabs on mobile viewports.
   - Each category renders one of three card templates:
     - **Learning**: Source tweet text, timestamp pill, four-step Feynman timeline cards.
     - **News**: Source tweet, summary block, bullet list of key points, and “Related Coverage” link list.
     - **Inspiration**: Tag chips, contextual analysis block, and a revealable “Generate Creative Spin” section with copy-to-clipboard.
   - Empty-state cards invite the user back to “Add Content” when no items exist.

These flows remain unchanged; implementation simply moves persistence/AI work into Convex.

### 2. Convex Schema & Shared Types

Create a `convex/schema.ts` matching the shared frontend types:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    originalText: v.string(),
    tweetUrl: v.optional(v.string()),
    category: v.union(
      v.literal("learning"),
      v.literal("news"),
      v.literal("inspiration")
    ),
    createdAt: v.number(),
    userId: v.optional(v.string()),
    isLoading: v.boolean(),
    error: v.optional(v.string()),
    learningData: v.optional(
      v.array(
        v.object({
          stepNumber: v.number(),
          concept: v.string(),
          explanation: v.string(),
          analogy: v.string(),
        })
      )
    ),
    newsData: v.optional(
      v.object({
        summary: v.string(),
        keyPoints: v.array(v.string()),
        similarLinks: v.array(
          v.object({
            title: v.string(),
            url: v.string(),
          })
        ),
      })
    ),
    inspirationData: v.optional(
      v.object({
        tags: v.array(v.string()),
        contextAnalysis: v.string(),
        suggestedTweet: v.string(),
      })
    ),
  }).index("by_category_created", ["category", "createdAt"]),
});
```

Mirror these interfaces in `shared/types.ts` for both the Vercel and Expo clients so Convex query results stay type-safe.

### 3. Convex Functions

1. **Queries**
   - `items.listByCategory` — args `{ category: Category }`. Returns documents ordered by `createdAt desc`, including tweet metadata and generated data.
   - `items.counts` — no args (or optional `userId`). Returns `{ learning: number; news: number; inspiration: number }`.
2. **Mutations & Actions**
   - `items.createDraft` (mutation): inserts `{ originalText, tweetUrl, category, createdAt: Date.now(), isLoading: true }` and returns `_id`.
   - `items.updateResult` (internal mutation): accepts `{ id, data, error? }` to apply AI output per category.
   - `tweets.extractFromUrl` (internal action): when only a URL is provided, fetch Twitter oEmbed/HTML to return `{ text, author, tweetId }`. Gracefully handles rate limits by returning `null`.
   - `learning.analyze`, `news.analyze`, `inspiration.analyze` (internal actions): call Gemini using the prompts defined in `services/gemini.ts`, ensuring JSON output. `learning.analyze` must explicitly direct the LLM to identify subjects inside the tweet and map the four Feynman stages to steps.
   - `items.createAndAnalyze` (action): orchestrates the full workflow
     1. Calls `items.createDraft`.
     2. If `originalText` resembles only a URL, calls `tweets.extractFromUrl` and substitutes the returned text.
     3. Switches on `category` and awaits the relevant analyzer.
     4. Writes data via `items.updateResult`, or captures the error message.

All actions must catch and report errors so the UI can surface “Failed to process content” in the card header.

### 4. Frontend Integration Plan

#### Web (Vercel)
1. Install Convex client packages and initialize `ConvexProvider` near the root (`index.tsx`).
2. Replace the local React `useState` store with:
   - `const counts = useQuery(api.items.counts);`
   - `const items = useQuery(api.items.listByCategory, { category: activeTab });`
3. Swap the textarea submit handler to call `const analyze = useMutation(api.items.createAndAnalyze);`.
4. Track optimistic state with a minimal local fallback (e.g., disable button while awaiting mutation).
5. Add tweet rendering:
   - When an item has `tweetUrl`, use [`react-tweet`](https://www.npmjs.com/package/react-tweet) (SSR-friendly) to render the embed inside each content card’s “source” block.
6. Remove `localStorage` persistence since Convex provides realtime synchronization.

#### Expo (iOS first)
1. Initialize an Expo project and install `convex/react-native`. Share `shared/types.ts` and `convex/_generated/api` via a workspace or simple copy for MVP.
2. App structure:
   - `AddContentScreen`: replicates the web UI using React Native components.
   - `BrowseLibraryScreen`: vertical stack of the three cards; tapping pushes `ResultsScreen`.
   - `ResultsScreen`: fetches data with `useQuery` and renders category-specific cards. Include a bottom tab navigator mirroring the web’s tabs.
3. Tweet display:
   - If `tweetUrl`, render a `WebView` pointing to the official Twitter embed HTML (wrap in a lightweight component that injects the embed script).
4. Button interactions reuse the same `useMutation(api.items.createAndAnalyze)` hook.

### 5. Deployment Steps

1. **Convex**
   - `npx create-convex@latest` to bootstrap.
   - Configure `.env.local` with `CONVEX_DEPLOYMENT`, `GEMINI_API_KEY`, and any future auth secrets.
   - `npx convex dev` locally, `npx convex deploy` for production.
2. **Web on Vercel**
   - Set Vercel environmental variables: `CONVEX_URL`, `CONVEX_DEPLOYMENT`, `GEMINI_API_KEY`.
   - Build command: `pnpm install && pnpm build`.
   - Output directory: `dist` (Vite) or `.next` if migrated to Next.js.
3. **Expo (iOS)**
   - Use `eas build -p ios` for TestFlight distribution.
   - In `app.config.js`, inject Convex + Gemini env values via `expo-constants`.
   - For tweet WebViews, ensure `NSAllowsArbitraryLoadsInWebContent` is set if needed.
   - Android tasks postponed per requirements but the codebase remains cross-platform ready.

Following this blueprint fulfills the approved plan without modifying the plan document itself.


