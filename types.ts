export type Category = 'learning' | 'news' | 'inspiration';

export interface LearningStep {
  stepNumber: number;
  concept: string;
  explanation: string;
  analogy: string;
}

export interface NewsData {
  summary: string;
  keyPoints: string[];
  similarLinks: Array<{
    title: string;
    url: string;
  }>;
}

export interface InspirationData {
  tags: string[];
  contextAnalysis: string;
  suggestedTweet: string;
}

export interface TweetItem {
  id: string;
  originalText: string;
  category: Category;
  createdAt: number;
  data?: LearningStep[] | NewsData | InspirationData;
  isLoading: boolean;
  error?: string;
}
