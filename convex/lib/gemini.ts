// Convex actions cannot import client-only utilities, so this module provides
// a server-friendly Gemini helper that mirrors the prompts used in the UI.
import type { InspirationData, LearningStep, NewsData } from "../../types";
import { GoogleGenAI } from "@google/genai";

let cachedClient: InstanceType<typeof GoogleGenAI> | null = null;

const loadClient = () => {
  if (!cachedClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Set it via Convex env variables."
      );
    }
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
};

const parseJSONResponse = <T>(text: string): T => {
  const trimmed = text.trim();
  try {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }
    return JSON.parse(trimmed);
  } catch {
    const fallback = trimmed.match(/\{[\s\S]*\}/);
    if (fallback?.[0]) {
      return JSON.parse(fallback[0]);
    }
    throw new Error("Gemini response could not be parsed as JSON.");
  }
};

const readResponseText = (response: any) => {
  if (!response) return "";
  if (typeof response.text === "function") return response.text();
  if (typeof response.response?.text === "function") {
    return response.response.text();
  }
  return response.text ?? response.response?.text ?? "";
};

export const generateLearningPath = async (
  text: string
): Promise<LearningStep[]> => {
  const client = loadClient();
  const prompt = `You are an expert educator using the Feynman Technique. Break down the following content into a 4-step learning path. Return ONLY valid JSON in this exact format:
{
  "steps": [
    { "stepNumber": 1, "concept": "Concept name", "explanation": "Clear explanation", "analogy": "Memorable analogy" },
    { "stepNumber": 2, "concept": "Concept name", "explanation": "Clear explanation", "analogy": "Memorable analogy" },
    { "stepNumber": 3, "concept": "Concept name", "explanation": "Clear explanation", "analogy": "Memorable analogy" },
    { "stepNumber": 4, "concept": "Concept name", "explanation": "Clear explanation", "analogy": "Memorable analogy" }
  ]
}

The 4 steps must follow the Feynman Technique:
1. Deconstruct the source content into fundamental assertions.
2. Explain it simply (a 12-year-old should understand).
3. Identify gaps and address missing context.
4. Re-assemble the ideas with narrative + analogies tying to the subject(s) mentioned in the tweet.

Content to analyze:
"${text}"

Return ONLY the JSON.`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });
  const raw = await readResponseText(response);
  if (!raw) throw new Error("No response text received from Gemini.");
  const parsed = parseJSONResponse<{ steps: LearningStep[] }>(raw);
  return parsed.steps;
};

export const generateInspiration = async (
  text: string
): Promise<InspirationData> => {
  const client = loadClient();
  const prompt = `You are a creative content strategist. Analyze the following content and provide inspiration insights. Return ONLY valid JSON:
{
  "tags": ["Tag1", "Tag2", "Tag3"],
  "contextAnalysis": "Why this resonates",
  "suggestedTweet": "Creative tweet capturing the essence (<=280 chars, include relevant emojis and hashtags)"
}

Tags should be 2-4 relevant categories. Context analysis should describe the emotional/psychological hooks. Suggested tweet must be original.

Content:
"${text}"
`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });
  const raw = await readResponseText(response);
  if (!raw) throw new Error("No response text received from Gemini.");
  return parseJSONResponse<InspirationData>(raw);
};

export const generateNewsAnalysis = async (
  text: string
): Promise<NewsData> => {
  const client = loadClient();
  const prompt = `You are a news analyst. Convert the content below into a briefing. Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "similarLinks": [
    { "title": "Related article title 1", "url": "#" },
    { "title": "Related article title 2", "url": "#" },
    { "title": "Related article title 3", "url": "#" }
  ]
}

Provide 3-5 key points and 3 similar links (use "#" if real URLs are unavailable).

Content:
"${text}"
`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });
  const raw = await readResponseText(response);
  if (!raw) throw new Error("No response text received from Gemini.");
  return parseJSONResponse<NewsData>(raw);
};



