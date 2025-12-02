// Convex actions cannot import client-only utilities, so this module provides
// a server-friendly OpenAI helper that replaces the Gemini implementation.
import type { InspirationData, LearningStep, NewsData } from "../../types";

let cachedClient: any = null;

const loadClient = () => {
  if (!cachedClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured. Set it via Convex env variables."
      );
    }
    // Use OpenAI API directly via fetch since we're in Convex
    cachedClient = { apiKey };
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
    throw new Error("OpenAI response could not be parsed as JSON.");
  }
};

const callOpenAI = async (prompt: string, model: string = "gpt-5-mini") => {
  const client = loadClient();
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${client.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

export const generateLearningPath = async (
  text: string
): Promise<LearningStep[]> => {
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

  const raw = await callOpenAI(prompt);
  if (!raw) throw new Error("No response text received from OpenAI.");
  const parsed = parseJSONResponse<{ steps: LearningStep[] }>(raw);
  return parsed.steps;
};

export const generateInspiration = async (
  text: string
): Promise<InspirationData> => {
  const prompt = `You are a creative content strategist. Analyze the following content and provide inspiration insights. Return ONLY valid JSON:
{
  "tags": ["Tag1", "Tag2", "Tag3"],
  "contextAnalysis": "Why this resonates",
  "suggestedTweet": "Creative tweet capturing the essence (<=280 chars, include relevant emojis and hashtags)"
}

Tags should be 2-4 relevant categories. Context analysis should describe the emotional/psychological hooks. Suggested tweet must be original.

Content:
"${text}"`;

  const raw = await callOpenAI(prompt);
  if (!raw) throw new Error("No response text received from OpenAI.");
  return parseJSONResponse<InspirationData>(raw);
};

export const generateNewsAnalysis = async (
  text: string
): Promise<NewsData> => {
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
"${text}"`;

  const raw = await callOpenAI(prompt);
  if (!raw) throw new Error("No response text received from OpenAI.");
  return parseJSONResponse<NewsData>(raw);
};

