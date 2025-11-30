import { LearningStep, NewsData, InspirationData } from "../types";

// Mock Data for Feynman Technique
const MOCK_LEARNING_PATH: LearningStep[] = [
  {
    stepNumber: 1,
    concept: "Deconstruct the Source",
    explanation: "Break down the tweet's core message into its fundamental assertions. Identify the primary claim and the supporting logic.",
    analogy: "Like unravelling a sweater to see the single thread it's made of."
  },
  {
    stepNumber: 2,
    concept: "The 12-Year-Old Test",
    explanation: "Rewrite the concept using simple language, avoiding all jargon. If you use a complex word, you haven't understood it well enough.",
    analogy: "Explaining how a rocket works using only the 1,000 most common words."
  },
  {
    stepNumber: 3,
    concept: "Gap Analysis",
    explanation: "Review your simplified explanation. Identify where you struggled to connect the dots or used filler words. These are your knowledge gaps.",
    analogy: "Finding the cracks in the foundation before building the house."
  },
  {
    stepNumber: 4,
    concept: "Re-Assemble with Narrative",
    explanation: "Construct a final, seamless explanation that uses analogies to bridge the gaps you identified. Create a story around the concept.",
    analogy: "Polishing a rough gemstone until it becomes a clear, multi-faceted jewel."
  }
];

const MOCK_NEWS_DATA: NewsData = {
  summary: "This content highlights a pivotal shift in the industry, focusing on the transition from experimental AI models to robust, production-grade agentic workflows. It suggests that reliability and steerability are now more critical than raw model performance.",
  keyPoints: [
    "Shift from experimentation to production",
    "Reliability > Capability in 2024",
    "Rise of Agentic Workflows"
  ],
  similarLinks: [
    { title: "The State of AI Agents 2024", url: "#" },
    { title: "Enterprise Adoption Trends Q3", url: "#" },
    { title: "Why Reliability is the New Moat", url: "#" }
  ]
};

const MOCK_INSPIRATION_DATA: InspirationData = {
  tags: ["Perspective", "Growth", "Innovation"],
  contextAnalysis: "The original text taps into a common sentiment about progress. It reframes a technical challenge as a human opportunity, using contrast to drive engagement.",
  suggestedTweet: "We often overestimate what we can do in a day and underestimate what we can do in a decade. Consistency isn't just a strategy; it's a superpower. 🚀 #GrowthMindset #LongGame"
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateLearningPath = async (text: string): Promise<LearningStep[]> => {
  await delay(1500); // Simulate network latency
  return MOCK_LEARNING_PATH;
};

export const generateInspiration = async (text: string): Promise<InspirationData> => {
  await delay(1500);
  return MOCK_INSPIRATION_DATA;
};

export const generateNewsAnalysis = async (text: string): Promise<NewsData> => {
  await delay(1500);
  return MOCK_NEWS_DATA;
};
