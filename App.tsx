import React, { useState, useEffect } from 'react';
import { generateLearningPath, generateInspiration, generateNewsAnalysis } from './services/gemini';
import { Category, TweetItem, LearningStep, InspirationData, NewsData } from './types';
import { BookOpenIcon, NewspaperIcon, LightbulbIcon, SendIcon, SparklesIcon, PlusIcon, LoaderIcon, ArrowLeftIcon, ChevronRightIcon, LayoutGridIcon, ArrowRightIcon } from './components/Icons';
import { Card } from './components/Card';

// Helper for date formatting
const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const App: React.FC = () => {
  // State
  const [view, setView] = useState<'home' | 'results'>('home');
  const [activeTab, setActiveTab] = useState<Category>('learning');
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('learning');
  const [items, setItems] = useState<TweetItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tweetmind_items');
    if (saved) {
      try {
        const parsedItems = JSON.parse(saved);
        setItems(parsedItems);
      } catch (e) {
        console.error("Failed to load items", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('tweetmind_items', JSON.stringify(items));
  }, [items]);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    const newItem: TweetItem = {
      id: Date.now().toString(),
      originalText: inputText,
      category: selectedCategory,
      createdAt: Date.now(),
      isLoading: true,
    };

    setItems(prev => [newItem, ...prev]);
    setInputText('');
    setIsProcessing(true);
    
    setActiveTab(selectedCategory);
    setView('results');

    try {
      let data;
      if (selectedCategory === 'learning') {
        data = await generateLearningPath(newItem.originalText);
      } else if (selectedCategory === 'inspiration') {
        data = await generateInspiration(newItem.originalText);
      } else if (selectedCategory === 'news') {
        data = await generateNewsAnalysis(newItem.originalText);
      }

      setItems(prev => prev.map(item => 
        item.id === newItem.id 
          ? { ...item, isLoading: false, data: data } 
          : item
      ));
    } catch (error) {
      setItems(prev => prev.map(item => 
        item.id === newItem.id 
          ? { ...item, isLoading: false, error: "Failed to process content. Please try again." } 
          : item
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoHome = () => {
    setView('home');
    setInputText('');
  };

  const handleNavigateToTab = (category: Category) => {
    setActiveTab(category);
    setView('results');
  };

  const filteredItems = items.filter(i => i.category === activeTab);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans relative selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Premium Background Layer */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Soft Gradient Orbs */}
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-400/20 blur-[120px]"></div>
        <div className="absolute right-[-5%] bottom-[-5%] h-[500px] w-[500px] rounded-full bg-purple-400/20 blur-[120px]"></div>
        <div className="absolute left-[40%] top-[40%] h-[300px] w-[300px] rounded-full bg-blue-400/10 blur-[100px]"></div>
      </div>

      <div className="relative z-10">
        {view === 'home' ? (
          <HomeView 
            inputText={inputText}
            setInputText={setInputText}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            handleSubmit={handleSubmit}
            isProcessing={isProcessing}
            items={items}
            onNavigate={handleNavigateToTab}
          />
        ) : (
          <ResultsView 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filteredItems={filteredItems}
            onBack={handleGoHome}
          />
        )}
      </div>
    </div>
  );
};

// --- View Components ---

const HomeView = ({ 
  inputText, setInputText, selectedCategory, setSelectedCategory, handleSubmit, isProcessing, items, onNavigate 
}: {
  inputText: string, 
  setInputText: (s: string) => void, 
  selectedCategory: Category, 
  setSelectedCategory: (c: Category) => void,
  handleSubmit: () => void,
  isProcessing: boolean,
  items: TweetItem[],
  onNavigate: (category: Category) => void
}) => {
  
  const counts = {
    learning: items.filter(i => i.category === 'learning').length,
    news: items.filter(i => i.category === 'news').length,
    inspiration: items.filter(i => i.category === 'inspiration').length,
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <div className="w-full max-w-4xl flex flex-col items-center gap-12 py-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 mb-2 ring-1 ring-slate-100">
            <SparklesIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">TweetMind</h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">Transform your tweets into structured knowledge, concise briefings, or creative sparks.</p>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Input */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                     <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">Step 1</span>
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Add Content</h3>
                </div>
                
                <Card className="w-full p-2 shadow-xl shadow-indigo-100/50 border-indigo-50 relative bg-white">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-xl" />
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your content here to begin..."
                    className="w-full bg-slate-50 border-0 rounded-lg p-6 text-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all h-40 resize-none mb-2"
                  />
                  
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {(['learning', 'news', 'inspiration'] as Category[]).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                            selectedCategory === cat 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]' 
                              : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/50'
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
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

            {/* Right Column: Navigation */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                     <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">Step 2</span>
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Browse Library</h3>
                </div>

                <div className="grid gap-4">
                    <NavCategoryCardDetailed 
                      title="Learning Paths"
                      description="Review your Feynman breakdowns and study guides."
                      count={counts.learning} 
                      icon={<BookOpenIcon className="w-6 h-6" />}
                      colorClass="text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white"
                      onClick={() => onNavigate('learning')}
                    />
                    <NavCategoryCardDetailed 
                      title="News Briefings" 
                      description="Access your summarized news and related articles."
                      count={counts.news} 
                      icon={<NewspaperIcon className="w-6 h-6" />}
                      colorClass="text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white"
                      onClick={() => onNavigate('news')}
                    />
                    <NavCategoryCardDetailed 
                      title="Inspiration Board" 
                      description="See your saved creative sparks and generated tweets."
                      count={counts.inspiration} 
                      icon={<LightbulbIcon className="w-6 h-6" />}
                      colorClass="text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white"
                      onClick={() => onNavigate('inspiration')}
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const NavCategoryCardDetailed = ({ title, description, count, icon, colorClass, onClick }: { title: string, description: string, count: number, icon: React.ReactNode, colorClass: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex items-center justify-between text-left w-full hover:border-indigo-200 relative overflow-hidden"
  >
    <div className="flex items-center gap-4 relative z-10">
      <div className={`p-3.5 rounded-2xl transition-colors duration-300 ${colorClass} shadow-sm`}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-900 text-base mb-1">{title}</h4>
        <p className="text-xs text-slate-500 font-medium mb-1">{description}</p>
        <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {count} {count === 1 ? 'Item' : 'Items'}
        </span>
      </div>
    </div>
    <div className="p-2 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors">
        <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
    </div>
  </button>
);

const ResultsView = ({ 
  activeTab, setActiveTab, filteredItems, onBack 
}: { 
  activeTab: Category, 
  setActiveTab: (c: Category) => void, 
  filteredItems: TweetItem[], 
  onBack: () => void 
}) => {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button className="flex items-center gap-3 group" onClick={onBack}>
            <div className="bg-white border border-slate-200 p-2 rounded-lg text-slate-500 group-hover:border-slate-300 group-hover:text-slate-800 transition-colors shadow-sm">
               <ArrowLeftIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">Back to Home</span>
          </button>
          
          {/* Desktop Tabs */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 h-full items-end gap-8">
            {(['learning', 'news', 'inspiration'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`pb-4 px-1 text-sm font-bold capitalize border-b-[3px] transition-all flex items-center gap-2 ${
                  activeTab === cat 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {cat === 'learning' && <BookOpenIcon className="w-4 h-4" />}
                {cat === 'news' && <NewspaperIcon className="w-4 h-4" />}
                {cat === 'inspiration' && <LightbulbIcon className="w-4 h-4" />}
                {cat}
              </button>
            ))}
          </div>

          <div className="w-20"></div> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:pb-12 pb-24">
         <div className="flex items-end justify-between mb-8">
             <div>
                <h2 className="text-2xl font-bold text-slate-900 capitalize mb-1">{activeTab} Library</h2>
                <p className="text-slate-500 text-sm">
                    {activeTab === 'learning' && "Master complex topics with the Feynman technique."}
                    {activeTab === 'news' && "Stay updated with concise summaries and sources."}
                    {activeTab === 'inspiration' && "Spark your creativity with new perspectives."}
                </p>
             </div>
             <div className="hidden md:block text-xs font-bold text-slate-400 bg-white/50 border border-slate-200/50 px-3 py-1 rounded-full backdrop-blur-sm">
                 {filteredItems.length} {filteredItems.length === 1 ? 'Result' : 'Results'}
             </div>
         </div>

         <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300/60">
              <div className="bg-white p-6 rounded-full mb-6 shadow-sm ring-1 ring-slate-100">
                {activeTab === 'learning' && <BookOpenIcon className="w-12 h-12 text-slate-300" />}
                {activeTab === 'news' && <NewspaperIcon className="w-12 h-12 text-slate-300" />}
                {activeTab === 'inspiration' && <LightbulbIcon className="w-12 h-12 text-slate-300" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No {activeTab} items yet</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-6">Go back to the home screen to add new content to your {activeTab} library.</p>
              <button 
                onClick={onBack} 
                className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
              >
                Add Content
              </button>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="animate-fade-in-up">
                 <ContentCard item={item} />
              </div>
            ))
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 py-2 flex justify-between items-center z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <NavButton 
          active={activeTab === 'learning'} 
          onClick={() => setActiveTab('learning')} 
          icon={<BookOpenIcon className="w-6 h-6" />} 
          label="Learning" 
        />
        <NavButton 
          active={activeTab === 'news'} 
          onClick={() => setActiveTab('news')} 
          icon={<NewspaperIcon className="w-6 h-6" />} 
          label="News" 
        />
        <NavButton 
          active={activeTab === 'inspiration'} 
          onClick={() => setActiveTab('inspiration')} 
          icon={<LightbulbIcon className="w-6 h-6" />} 
          label="Inspiration" 
        />
      </nav>
    </div>
  );
};

// --- Sub Components ---

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${active ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
  >
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

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
             <p className="text-slate-700 font-medium leading-relaxed italic opacity-90">"{item.originalText}"</p>
        </div>
      </div>
      
      <div className="p-6">
        {item.category === 'learning' && <LearningView data={item.data as LearningStep[]} />}
        {item.category === 'news' && <NewsView data={item.data as NewsData} />}
        {item.category === 'inspiration' && <InspirationView data={item.data as InspirationData} />}
      </div>
    </Card>
  );
};

const LearningView = ({ data }: { data: LearningStep[] }) => {
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

const NewsView = ({ data }: { data: NewsData }) => {
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

const InspirationView = ({ data }: { data: InspirationData }) => {
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
              className="w-full h-32 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 group overflow-hidden relative"
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