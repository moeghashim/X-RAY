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
  tweetUrl?: string;
  tweetId?: string;
  tweetAuthor?: string;
  category: Category;
  createdAt: number;
  learningData?: LearningStep[];
  newsData?: NewsData;
  inspirationData?: InspirationData;
  isLoading: boolean;
  error?: string;
}
