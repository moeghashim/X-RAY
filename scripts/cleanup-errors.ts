#!/usr/bin/env node
/**
 * Script to clean up old error messages from the database.
 * 
 * This script calls the cleanupOldErrors mutation to remove errors related to:
 * - Old Gemini API errors
 * - Temperature parameter errors from GPT-5-mini migration
 * 
 * Usage:
 *   pnpm cleanup:errors
 *   or
 *   pnpm tsx scripts/cleanup-errors.ts
 * 
 * Environment:
 *   The script will use VITE_CONVEX_URL from .env.local or environment variables
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local if it exists
config({ path: resolve(process.cwd(), ".env.local") });

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: VITE_CONVEX_URL or CONVEX_URL environment variable is required");
  console.error("\n   Options:");
  console.error("   1. Set it in .env.local:");
  console.error("      VITE_CONVEX_URL=https://your-deployment.convex.cloud");
  console.error("\n   2. Export it:");
  console.error("      export VITE_CONVEX_URL=https://your-deployment.convex.cloud");
  console.error("\n   3. Or use Convex CLI directly:");
  console.error("      npx convex run items:cleanupOldErrors");
  process.exit(1);
}

async function cleanupErrors() {
  console.log("🧹 Starting cleanup of old error messages...");
  console.log(`📡 Connecting to Convex: ${CONVEX_URL.replace(/\/$/, "")}`);
  console.log("");
  
  const client = new ConvexHttpClient(CONVEX_URL);
  
  try {
    console.log("⏳ Running cleanup mutation...");
    const result = await client.mutation(api.items.cleanupOldErrors, {});
    
    console.log("");
    console.log(`✅ Cleanup completed successfully!`);
    console.log(`   Cleaned ${result.cleaned} item(s)`);
    
    if (result.cleaned === 0) {
      console.log("   No old errors found to clean up.");
    } else {
      console.log(`   ${result.cleaned} error message(s) cleared from the database.`);
    }
  } catch (error: any) {
    console.error("");
    console.error("❌ Error running cleanup:", error.message);
    
    if (error.message?.includes("authentication") || error.message?.includes("401")) {
      console.error("\n💡 Tip: Make sure you're authenticated with Convex:");
      console.error("   npx convex dev");
      console.error("\n   Or use the Convex CLI directly:");
      console.error("   npx convex run items:cleanupOldErrors");
    } else if (error.message?.includes("404") || error.message?.includes("not found")) {
      console.error("\n💡 Tip: Make sure the mutation is deployed:");
      console.error("   npx convex deploy");
    }
    process.exit(1);
  }
}

cleanupErrors();

