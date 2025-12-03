import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import type { Id } from "./_generated/dataModel";
import {
  generateInspiration,
  generateLearningPath,
  generateNewsAnalysis,
} from "./lib/openai";
import type {
  Category,
  InspirationData,
  LearningStep,
  NewsData,
} from "../types";

const CATEGORY = v.union(
  v.literal("learning"),
  v.literal("news"),
  v.literal("inspiration")
);

const tweetUrlFromText = (text: string) => {
  const match = text.match(
    /(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^\s]+)/
  );
  return match ? match[1] : undefined;
};

const removeTweetUrl = (text: string, tweetUrl?: string) => {
  if (!tweetUrl) return text.trim();
  return text.replace(tweetUrl, "").trim();
};

const stripHtml = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const fetchTweetText = async (url: string) => {
  try {
    const resp = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(
        url
      )}&omit_script=1`
    );
    if (!resp.ok) return "";
    const data = (await resp.json()) as { html?: string };
    return data.html ? stripHtml(data.html) : "";
  } catch (error) {
    console.error("Failed to fetch tweet text", error);
    return "";
  }
};

export const listByCategory = query({
  args: { category: CATEGORY },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_category_created", (q) =>
        q.eq("category", args.category)
      )
      .order("desc")
      .collect();
  },
});

export const counts = query({
  args: {},
  handler: async (ctx) => {
    const categories = ["learning", "news", "inspiration"] as const;
    const entries = await Promise.all(
      categories.map(async (category) => {
        const count = await ctx.db
          .query("items")
          .withIndex("by_category_created", (q) => q.eq("category", category))
          .collect();
        return [category, count.length] as const;
      })
    );
    return Object.fromEntries(entries);
  },
});

type CreateDraftArgs = {
  originalText: string;
  tweetUrl?: string;
  category: Category;
};

export const createDraft = mutation({
  args: {
    originalText: v.string(),
    tweetUrl: v.optional(v.string()),
    category: CATEGORY,
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("items", {
      originalText: args.originalText,
      tweetUrl: args.tweetUrl,
      category: args.category,
      createdAt: Date.now(),
      isLoading: true,
    });
  },
});

const learningValue = v.array(
  v.object({
    stepNumber: v.number(),
    concept: v.string(),
    explanation: v.string(),
    analogy: v.string(),
  })
);

const newsValue = v.object({
  summary: v.string(),
  keyPoints: v.array(v.string()),
  similarLinks: v.array(
    v.object({
      title: v.string(),
      url: v.string(),
    })
  ),
});

const inspirationValue = v.object({
  tags: v.array(v.string()),
  contextAnalysis: v.string(),
  suggestedTweet: v.string(),
});

type FinalizeArgs = {
  id: Id<"items">;
  patch: {
    isLoading: boolean;
    error?: string;
    learningData?: LearningStep[];
    newsData?: NewsData;
    inspirationData?: InspirationData;
  };
};

export const finalize = mutation({
  args: {
    id: v.id("items"),
    patch: v.object({
      isLoading: v.boolean(),
      error: v.optional(v.string()),
      learningData: v.optional(learningValue),
      newsData: v.optional(newsValue),
      inspirationData: v.optional(inspirationValue),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.patch);
  },
});

const createDraftRef = makeFunctionReference<
  "mutation",
  CreateDraftArgs,
  Id<"items">
>("items:createDraft");

const finalizeRef = makeFunctionReference<"mutation", FinalizeArgs, void>(
  "items:finalize"
);

export const createAndAnalyze = action({
  args: {
    originalText: v.string(),
    tweetUrl: v.optional(v.string()),
    category: CATEGORY,
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    id: Id<"items">;
  }> => {
    const explicitTweetUrl = args.tweetUrl ?? tweetUrlFromText(args.originalText);
    const cleanedText = removeTweetUrl(args.originalText, explicitTweetUrl);
    const itemId = await ctx.runMutation(createDraftRef, {
      originalText: args.originalText,
      tweetUrl: explicitTweetUrl,
      category: args.category,
    });

    try {
      let textForAI = cleanedText;
      if (!textForAI && explicitTweetUrl) {
        textForAI = await fetchTweetText(explicitTweetUrl);
      }
      if (!textForAI) {
        throw new Error("Please include tweet text or a tweet link with content.");
      }

      if (args.category === "learning") {
        const learningData = await generateLearningPath(textForAI);
        await ctx.runMutation(finalizeRef, {
          id: itemId,
          patch: {
            isLoading: false,
            learningData,
            error: undefined,
          },
        });
      } else if (args.category === "news") {
        const newsData = await generateNewsAnalysis(textForAI);
        await ctx.runMutation(finalizeRef, {
          id: itemId,
          patch: {
            isLoading: false,
            newsData,
            error: undefined,
          },
        });
      } else {
        const inspirationData = await generateInspiration(textForAI);
        await ctx.runMutation(finalizeRef, {
          id: itemId,
          patch: {
            isLoading: false,
            inspirationData,
            error: undefined,
          },
        });
      }
    } catch (error: any) {
      console.error("Failed to process content:", error);
      await ctx.runMutation(finalizeRef, {
        id: itemId,
        patch: {
          isLoading: false,
          error:
            error?.message ??
            "Failed to process content. Please try again with a different tweet.",
        },
      });
    }

    return { id: itemId };
  },
});

// Delete an item
export const deleteItem = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Cleanup function to remove old error items or clear their errors
export const cleanupOldErrors = mutation({
  handler: async (ctx) => {
    const allItems = await ctx.db.query("items").collect();
    let cleaned = 0;
    
    for (const item of allItems) {
      if (!item.error) continue;
      
      const errorLower = item.error.toLowerCase();
      
      // Only clear errors that are specifically related to:
      // 1. Gemini API (old implementation)
      // 2. Temperature parameter errors - must match the specific OpenAI error pattern
      const isGeminiError = errorLower.includes("gemini") || errorLower.includes("generativelanguage.googleapis.com");
      
      // Match the specific OpenAI temperature error pattern to avoid false positives
      // The actual error message is: "Unsupported value: 'temperature' does not support 0.7 with this model"
      // We require ALL of these conditions to prevent matching unrelated errors containing "0.7"
      const isTemperatureError = 
        errorLower.includes("temperature") &&
        (errorLower.includes("does not support") || errorLower.includes("unsupported value")) &&
        errorLower.includes("0.7") &&
        (errorLower.includes("with this model") || errorLower.includes("only the default"));
      
      if (isGeminiError || isTemperatureError) {
        await ctx.db.patch(item._id, {
          error: undefined,
        });
        cleaned++;
      }
    }
    
    return { cleaned };
  },
});


