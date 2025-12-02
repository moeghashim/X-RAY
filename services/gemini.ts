import { LearningStep, NewsData, InspirationData } from "../types";

// Lazy load GoogleGenAI to avoid import errors at module load time
let GoogleGenAI: any = null;
const loadGoogleGenAI = async () => {
  if (!GoogleGenAI) {
    try {
      const module = await import("@google/genai");
      GoogleGenAI = module.GoogleGenAI;
    } catch (error) {
      console.error('Failed to load @google/genai:', error);
      throw new Error('Failed to load Gemini AI library. Please check your internet connection and try again.');
    }
  }
  return GoogleGenAI;
};

// Initialize Gemini AI client
const getGenAI = async () => {
  // Access environment variable - Vite's define will replace process.env.GEMINI_API_KEY at build time
  // @ts-ignore - Vite replaces this at build time via define
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'undefined' || apiKey === 'null') {
    console.error('GEMINI_API_KEY is not set. Please add your API key to .env.local');
    throw new Error('GEMINI_API_KEY is not set. Please add your API key to .env.local');
  }
  
  const GenAI = await loadGoogleGenAI();
  return new GenAI({ apiKey });
};

// Helper function to parse JSON from Gemini response
const parseJSONResponse = <T>(text: string): T => {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonString.trim());
  } catch (error) {
    // If parsing fails, try to find JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Failed to parse JSON response: ${error}`);
  }
};

export const generateLearningPath = async (text: string): Promise<LearningStep[]> => {
  try {
    const genAI = await getGenAI();

    const prompt = `You are an expert educator using the Feynman Technique. Break down the following content into a 4-step learning path. Return ONLY valid JSON in this exact format:

{
  "steps": [
    {
      "stepNumber": 1,
      "concept": "Concept name",
      "explanation": "Clear explanation",
      "analogy": "Memorable analogy"
    },
    {
      "stepNumber": 2,
      "concept": "Concept name",
      "explanation": "Clear explanation",
      "analogy": "Memorable analogy"
    },
    {
      "stepNumber": 3,
      "concept": "Concept name",
      "explanation": "Clear explanation",
      "analogy": "Memorable analogy"
    },
    {
      "stepNumber": 4,
      "concept": "Concept name",
      "explanation": "Clear explanation",
      "analogy": "Memorable analogy"
    }
  ]
}

The 4 steps should follow the Feynman Technique:
1. Deconstruct the Source - Break down the core message into fundamental assertions
2. The 12-Year-Old Test - Simplify using plain language, avoiding jargon
3. Gap Analysis - Identify knowledge gaps and areas that need clarification
4. Re-Assemble with Narrative - Create a seamless explanation with analogies and stories

Content to analyze:
"${text}"

Return ONLY the JSON, no other text.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    
    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    const parsed = parseJSONResponse<{ steps: LearningStep[] }>(responseText);
    return parsed.steps;
  } catch (error) {
    console.error('Error generating learning path:', error);
    throw new Error('Failed to generate learning path. Please try again.');
  }
};

export const generateInspiration = async (text: string): Promise<InspirationData> => {
  try {
    const genAI = await getGenAI();

    const prompt = `You are a creative content strategist. Analyze the following content and provide inspiration insights. Return ONLY valid JSON in this exact format:

{
  "tags": ["Tag1", "Tag2", "Tag3"],
  "contextAnalysis": "Analysis of what makes this content engaging and what themes it taps into",
  "suggestedTweet": "A creative, engaging tweet inspired by this content (max 280 characters, include relevant emojis and hashtags)"
}

The tags should be 2-4 relevant categories (e.g., "Perspective", "Growth", "Innovation", "Wisdom").
The contextAnalysis should explain what makes the content compelling and what psychological or emotional themes it engages.
The suggestedTweet should be original, engaging, and capture the essence or inspiration from the content.

Content to analyze:
"${text}"

Return ONLY the JSON, no other text.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    
    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    return parseJSONResponse<InspirationData>(responseText);
  } catch (error) {
    console.error('Error generating inspiration:', error);
    throw new Error('Failed to generate inspiration. Please try again.');
  }
};

export const generateNewsAnalysis = async (text: string): Promise<NewsData> => {
  try {
    const genAI = await getGenAI();

    const prompt = `You are a news analyst. Analyze the following content and provide a news briefing. Return ONLY valid JSON in this exact format:

{
  "summary": "A comprehensive 2-3 sentence summary of the key points",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "similarLinks": [
    {
      "title": "Related article title 1",
      "url": "#"
    },
    {
      "title": "Related article title 2",
      "url": "#"
    },
    {
      "title": "Related article title 3",
      "url": "#"
    }
  ]
}

Provide 3-5 key points that capture the most important information.
Provide 3 similarLinks with descriptive titles (you can use "#" as placeholder URLs since we don't have actual sources).

Content to analyze:
"${text}"

Return ONLY the JSON, no other text.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    
    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    return parseJSONResponse<NewsData>(responseText);
  } catch (error) {
    console.error('Error generating news analysis:', error);
    throw new Error('Failed to generate news analysis. Please try again.');
  }
};
