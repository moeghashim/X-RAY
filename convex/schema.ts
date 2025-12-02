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



