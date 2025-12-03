import React, { useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { Tweet } from "react-tweet";
import {
  Category,
  TweetItem,
  LearningStep,
  InspirationData,
  NewsData,
} from "./types";
import {
  BookOpenIcon,
  NewspaperIcon,
  LightbulbIcon,
  SparklesIcon,
  LoaderIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from "./components/Icons";
import { Card } from "./components/Card";
import "react-tweet/theme.css";

// Helper for date formatting
const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const tweetUrlRegex =
  /(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+)/i;

const extractTweetUrl = (text: string) => {
  const match = text.match(tweetUrlRegex);
  return match ? match[1] : undefined;
};

const CATEGORY_LIST: Category[] = ["learning", "news", "inspiration"];

const getTweetIdFromUrl = (url?: string) => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/");
    return segments.pop()?.split("?")[0] ?? undefined;
  } catch {
    return undefined;
  }
};

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<Category>('learning');
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('learning');
  const [isProcessing, setIsProcessing] = useState(false);
  const librarySectionRef = useRef<HTMLDivElement | null>(null);

  const countsData = useQuery("items:counts");
  const itemsData = useQuery("items:listByCategory", { category: activeTab });
  const createAndAnalyze = useAction("items:createAndAnalyze");

  const counts: Record<Category, number> = {
    learning: countsData?.learning ?? 0,
    news: countsData?.news ?? 0,
    inspiration: countsData?.inspiration ?? 0,
  };

  const normalizedItems: TweetItem[] = useMemo(() => {
    if (!itemsData) return [];
    return itemsData.map((item: any) => ({
      id: item._id,
      originalText: item.originalText,
      tweetUrl: item.tweetUrl ?? undefined,
      category: item.category,
      createdAt: item.createdAt,
      learningData: item.learningData ?? undefined,
      newsData: item.newsData ?? undefined,
      inspirationData: item.inspirationData ?? undefined,
      isLoading: item.isLoading,
      error: item.error ?? undefined,
    }));
  }, [itemsData]);

  const isLibraryLoading = itemsData === undefined;

  const scrollToLibrary = () => {
    if (librarySectionRef.current) {
      librarySectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const handleSubmit = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const tweetUrl = extractTweetUrl(trimmed);
    setIsProcessing(true);
    setActiveTab(selectedCategory);
    scrollToLibrary();

    try {
      await createAndAnalyze({
        originalText: trimmed,
        tweetUrl,
        category: selectedCategory,
      });
      setInputText("");
    } catch (error) {
      console.error("Failed to analyze content", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigateToTab = (category: Category) => {
    setActiveTab(category);
    scrollToLibrary();
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans relative selection:bg-black selection:text-white overflow-x-hidden">
      {/* Geist Background Layer */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-white">
      </div>

      <div className="relative z-10">
        <HomeView 
          inputText={inputText}
          setInputText={setInputText}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          handleSubmit={handleSubmit}
          isProcessing={isProcessing}
          counts={counts}
          onNavigate={handleNavigateToTab}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          items={normalizedItems}
          isLibraryLoading={isLibraryLoading}
          libraryRef={librarySectionRef}
        />
      </div>
    </div>
  );
};

// --- View Components ---

const HomeView = ({
  inputText,
  setInputText,
  selectedCategory,
  setSelectedCategory,
  handleSubmit,
  isProcessing,
  counts,
  onNavigate,
  activeTab,
  setActiveTab,
  items,
  isLibraryLoading,
  libraryRef,
}: {
  inputText: string;
  setInputText: (s: string) => void;
  selectedCategory: Category;
  setSelectedCategory: (c: Category) => void;
  handleSubmit: () => void;
  isProcessing: boolean;
  counts: Record<Category, number>;
  onNavigate: (category: Category) => void;
  activeTab: Category;
  setActiveTab: (category: Category) => void;
  items: TweetItem[];
  isLibraryLoading: boolean;
  libraryRef: React.RefObject<HTMLDivElement>;
}) => {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <div className="w-full max-w-4xl flex flex-col items-center gap-12 py-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-lg border border-geist-border mb-2">
            <SparklesIcon className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black">TweetMind</h1>
          <p className="text-lg text-geist-muted-foreground max-w-md mx-auto leading-relaxed">Transform your tweets into structured knowledge, concise briefings, or creative sparks.</p>
        </div>

        <div className="w-full flex flex-col gap-8">
            {/* Add Content Section */}
            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-geist-muted-foreground uppercase tracking-wider">Add Content</h3>
                
                <Card className="w-full p-2 relative bg-white">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your content here to begin..."
                    className="w-full bg-geist-muted border border-geist-input rounded-lg p-6 text-lg text-black placeholder-geist-muted-foreground focus:ring-2 focus:ring-black focus:bg-white focus:border-black transition-all h-40 resize-none mb-2"
                  />
                  
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {CATEGORY_LIST.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`flex flex-col items-center gap-2 py-3 px-2 rounded-lg border transition-all duration-200 group relative overflow-hidden ${
                            selectedCategory === cat 
                              ? 'bg-[var(--ds-blue-400)] border-[var(--ds-blue-400)] text-white shadow-md ring-2 ring-[var(--ds-blue-400)]' 
                              : 'bg-white border-geist-border text-geist-muted-foreground hover:bg-[var(--ds-blue-400)] hover:border-[var(--ds-blue-400)] hover:text-white focus:bg-[var(--ds-blue-400)] focus:border-[var(--ds-blue-400)] focus:text-white'
                          }`}
                        >
                          <div className={`transition-transform duration-300 ${selectedCategory === cat ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {cat === 'learning' && <BookOpenIcon className="w-5 h-5" />}
                            {cat === 'news' && <NewspaperIcon className="w-5 h-5" />}
                            {cat === 'inspiration' && <LightbulbIcon className="w-5 h-5" />}
                          </div>
                          <span className="font-medium capitalize text-xs">{cat}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!inputText.trim() || isProcessing}
                      id="analyze-content-button"
                      className="analyze-content-btn w-full disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-lg font-semibold text-base transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                      style={{ 
                        backgroundColor: '#000000',
                        background: '#000000',
                        color: '#ffffff'
                      }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.setProperty('background-color', '#1a1a1a', 'important');
                          e.currentTarget.style.setProperty('background', '#1a1a1a', 'important');
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.setProperty('background-color', '#000000', 'important');
                          e.currentTarget.style.setProperty('background', '#000000', 'important');
                        }
                      }}
                    >
                      <div className="relative flex items-center gap-2">
                        {isProcessing ? (
                          <>
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Analyze Content</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </Card>
            </div>

            {/* Browse Library Section */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Browse Library</h3>

                <div className="grid gap-4">
                    <NavCategoryCardDetailed 
                      title="Learning Paths"
                      description="Review your Feynman breakdowns and study guides."
                      count={counts.learning} 
                      icon={<BookOpenIcon className="w-6 h-6" />}
                      onClick={() => onNavigate('learning')}
                      isActive={activeTab === 'learning'}
                    />
                    <NavCategoryCardDetailed 
                      title="News Briefings" 
                      description="Access your summarized news and related articles."
                      count={counts.news} 
                      icon={<NewspaperIcon className="w-6 h-6" />}
                      onClick={() => onNavigate('news')}
                      isActive={activeTab === 'news'}
                    />
                    <NavCategoryCardDetailed 
                      title="Inspiration Board" 
                      description="See your saved creative sparks and generated tweets."
                      count={counts.inspiration} 
                      icon={<LightbulbIcon className="w-6 h-6" />}
                      onClick={() => onNavigate('inspiration')}
                      isActive={activeTab === 'inspiration'}
                    />
                </div>
            </div>

            <LibrarySection
              ref={libraryRef}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              items={items}
              isLoading={isLibraryLoading}
            />
        </div>
      </div>
    </div>
  );
};

const NavCategoryCardDetailed = ({ title, description, count, icon, onClick, isActive = false }: { title: string, description: string, count: number, icon: React.ReactNode, onClick: () => void, isActive?: boolean }) => (
  <button 
    onClick={onClick}
    aria-pressed={isActive}
    className={`bg-white p-5 rounded-lg border border-geist-border shadow-sm hover:shadow-md transition-all group flex items-center justify-between text-left w-full hover:border-black relative overflow-hidden ${
      isActive ? 'ring-2 ring-black bg-geist-muted' : ''
    }`}
  >
    <div className="flex items-center gap-4 relative z-10">
      <div className={`p-3.5 rounded-lg transition-colors duration-200 ${
        isActive ? 'bg-black text-white' : 'bg-geist-muted text-black group-hover:bg-black group-hover:text-white'
      }`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-black text-base mb-1">{title}</h4>
        <p className="text-xs text-geist-muted-foreground font-medium mb-1">{description}</p>
        <span className="inline-block bg-geist-muted text-geist-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {count} {count === 1 ? 'Item' : 'Items'}
        </span>
      </div>
    </div>
    <div className="p-2 bg-geist-muted rounded-full group-hover:bg-black transition-colors">
        <ArrowRightIcon className="w-4 h-4 text-geist-muted-foreground group-hover:text-white transition-colors" />
    </div>
  </button>
);

const TAB_DESCRIPTIONS: Record<Category, string> = {
  learning: "Master complex topics with the Feynman technique.",
  news: "Stay updated with concise summaries and sources.",
  inspiration: "Spark your creativity with new perspectives.",
};

const LibrarySection = React.forwardRef<
  HTMLDivElement,
  {
    activeTab: Category;
    setActiveTab: (c: Category) => void;
    items: TweetItem[];
    isLoading: boolean;
  }
>(({ activeTab, setActiveTab, items, isLoading }, ref) => (
  <section ref={ref} className="space-y-6">
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Library
        </h3>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize">
              {activeTab} Library
            </h2>
            <p className="text-slate-500 text-sm">
              {TAB_DESCRIPTIONS[activeTab]}
            </p>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-white/70 border border-slate-200/70 px-3 py-1 rounded-full backdrop-blur-sm self-start md:self-auto">
            {items.length} {items.length === 1 ? "Result" : "Results"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {CATEGORY_LIST.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold capitalize transition-all ${
              activeTab === cat
                ? "bg-black text-white border-black shadow-md"
                : "bg-white border-geist-border text-geist-muted-foreground hover:border-black hover:text-black"
            }`}
          >
            {cat === "learning" && <BookOpenIcon className="w-4 h-4" />}
            {cat === "news" && <NewspaperIcon className="w-4 h-4" />}
            {cat === "inspiration" && <LightbulbIcon className="w-4 h-4" />}
            {cat}
          </button>
        ))}
      </div>
    </div>

    <div className="space-y-6">
      {isLoading ? (
        Array.from({ length: 2 }).map((_, idx) => (
          <Card key={idx} className="p-6 animate-pulse space-y-4">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
            </div>
          </Card>
        ))
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white/80 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300/60">
          <div className="bg-white p-6 rounded-full mb-6 shadow-sm ring-1 ring-slate-100">
            {activeTab === "learning" && (
              <BookOpenIcon className="w-12 h-12 text-slate-300" />
            )}
            {activeTab === "news" && (
              <NewspaperIcon className="w-12 h-12 text-slate-300" />
            )}
            {activeTab === "inspiration" && (
              <LightbulbIcon className="w-12 h-12 text-slate-300" />
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No {activeTab} items yet
          </h3>
          <p className="text-slate-500 max-w-xs mx-auto">
            Add content from the main section above to populate this library.
          </p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="animate-fade-in-up">
            <ContentCard item={item} />
          </div>
        ))
      )}
    </div>
  </section>
));

LibrarySection.displayName = "LibrarySection";

const ContentCard = ({ item }: { item: TweetItem }) => {
  if (item.isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-slate-100 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  if (item.error) {
    return (
      <Card className="p-6 border-red-100 bg-red-50">
        <p className="text-red-600 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {item.error}
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden group">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
             <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                    {item.category}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                    {formatDate(item.createdAt)}
                </span>
             </div>
             {item.tweetUrl && (
               <div className="mb-4">
                 <TweetEmbed tweetUrl={item.tweetUrl} />
               </div>
             )}
             <p className="text-slate-700 font-medium leading-relaxed italic opacity-90">
               "{item.originalText}"
             </p>
        </div>
      </div>
      
      <div className="p-6">
        {item.category === 'learning' && <LearningView data={item.learningData} />}
        {item.category === 'news' && <NewsView data={item.newsData} />}
        {item.category === 'inspiration' && <InspirationView data={item.inspirationData} />}
      </div>
    </Card>
  );
};

const TweetEmbed = ({ tweetUrl }: { tweetUrl: string }) => {
  const tweetId = getTweetIdFromUrl(tweetUrl);
  if (!tweetId) {
    return (
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-indigo-600 hover:underline"
      >
        View tweet
      </a>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-slate-900">
      <Tweet id={tweetId} />
    </div>
  );
};

const LearningView = ({ data }: { data?: LearningStep[] }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
           <BookOpenIcon className="w-5 h-5" />
        </div>
        <div>
            <h3 className="font-bold text-slate-900 text-lg">Feynman Breakdown</h3>
            <p className="text-xs text-slate-500">Simplified concept explanation</p>
        </div>
      </div>
      <div className="relative border-l-2 border-indigo-100 pl-8 space-y-12 ml-3">
        {data.map((step, idx) => (
          <div key={idx} className="relative">
             <div className="absolute -left-[43px] top-0 w-8 h-8 rounded-full bg-white border-2 border-indigo-600 text-indigo-600 flex items-center justify-center text-sm font-bold shadow-sm z-10">
               {step.stepNumber}
             </div>
             <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-bold text-slate-800 mb-2">{step.concept}</h4>
                <p className="text-slate-600 mb-4 leading-relaxed">{step.explanation}</p>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-sm text-amber-900">
                <span className="font-bold flex items-center gap-2 mb-1 text-amber-700 text-xs uppercase tracking-wide">
                    <LightbulbIcon className="w-3 h-3" /> Analogy
                </span>
                {step.analogy}
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NewsView = ({ data }: { data?: NewsData }) => {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
         <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <NewspaperIcon className="w-5 h-5" />
         </div>
         <div>
            <h3 className="font-bold text-slate-900 text-lg">Briefing</h3>
            <p className="text-xs text-slate-500">Summary and related sources</p>
         </div>
      </div>
      
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">{data.summary}</p>
        <div className="mt-4 pt-4 border-t border-slate-200">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Points</h5>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                {data.keyPoints?.map((kp, i) => (
                    <li key={i}>{kp}</li>
                ))}
            </ul>
        </div>
      </div>

      {data.similarLinks && data.similarLinks.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Related Coverage
          </h4>
          <div className="grid gap-3">
            {data.similarLinks.map((link, idx) => (
              <a 
                  key={idx}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 border border-blue-100">
                    {idx + 1}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{link.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        Source
                    </p>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InspirationView = ({ data }: { data?: InspirationData }) => {
  const [revealed, setRevealed] = useState(false);
  
  if (!data) return null;

  return (
    <div className="space-y-6">
       <div className="flex flex-wrap gap-2 mb-2">
         {data.tags.map(tag => (
           <span key={tag} className="px-3 py-1 bg-white border border-purple-100 text-purple-600 text-xs rounded-full font-bold uppercase tracking-wide shadow-sm">#{tag}</span>
         ))}
       </div>

       <div className="bg-slate-50 p-6 rounded-2xl text-sm text-slate-600 italic border border-slate-100 leading-relaxed relative">
         <div className="absolute top-4 left-4 opacity-10">
            <SparklesIcon className="w-8 h-8" />
         </div>
         <span className="relative z-10">{data.contextAnalysis}</span>
       </div>

       <div className="relative mt-8">
         {!revealed ? (
            <button 
              onClick={() => setRevealed(true)}
              className="w-full h-32 bg-black hover:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <LightbulbIcon className="w-8 h-8 mb-2 group-hover:animate-bounce" />
              <span className="font-bold text-lg tracking-wide">Generate Creative Spin</span>
            </button>
         ) : (
            <div className="bg-white border-2 border-indigo-50 rounded-2xl p-8 shadow-xl shadow-indigo-100/50 relative animate-fade-in-up">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-md uppercase tracking-wider flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" /> Generated
              </div>
              <p className="text-xl text-slate-800 leading-relaxed font-medium font-serif text-center">
                "{data.suggestedTweet}"
              </p>
              <div className="mt-8 pt-4 border-t border-slate-50 flex justify-center gap-4">
                 <button 
                  onClick={() => setRevealed(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider px-4 py-2"
                >
                  Close
                </button>
                <button 
                  onClick={() => navigator.clipboard.writeText(data.suggestedTweet)}
                  className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Copy to Clipboard
                </button>
              </div>
            </div>
         )}
       </div>
    </div>
  );
};

export default App;