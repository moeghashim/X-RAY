<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xW5vWmBQTY8nhCjXTR-K9pfqp1sIejxK

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies (pnpm recommended):
   ```bash
   pnpm install
   ```
2. Provision Convex:
   ```bash
   pnpm convex:dev
   ```
   This generates a `CONVEX_DEPLOYMENT` URL. Add it to `.env.local`:
   ```ini
   VITE_CONVEX_URL=<https://your-deployment.convex.cloud>
   ```
3. Configure secrets:
   - Frontend: `.env.local`
     ```ini
     VITE_CONVEX_URL=...
     ```
   - Convex (server): `pnpm convex env set GEMINI_API_KEY "<your Gemini key>"`
4. Run the web app:
   ```bash
   pnpm dev
   ```
