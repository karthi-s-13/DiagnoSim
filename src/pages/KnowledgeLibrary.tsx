import { useState, useMemo } from "react";
import { Search, Book, Info, Shield, Activity, Sparkles, ChevronRight, Bookmark, BookmarkCheck, Stethoscope, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DISEASE_DATA } from "../data/diseases";
import { GoogleGenAI } from "@google/genai";

export default function KnowledgeLibrary() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selected, setSelected] = useState(DISEASE_DATA[0]);
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = useMemo(() => {
    const cats = ["All", ...new Set(DISEASE_DATA.map(d => d.category))];
    return cats;
  }, []);

  const filtered = useMemo(() => {
    return DISEASE_DATA.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" || d.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const toggleBookmark = (name: string) => {
    setBookmarked(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const generateAiSummary = async () => {
    if (!selected) return;
    setIsGenerating(true);
    setAiSummary(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a high-yield clinical summary for ${selected.name}. Include: 
        1. Pathophysiology (1 sentence)
        2. Key diagnostic findings
        3. First-line management
        4. One "Pro Tip" for medical students.
        Keep it concise and professional.`,
      });
      setAiSummary(response.text);
    } catch (error) {
      console.error("AI Generation failed:", error);
      setAiSummary("Failed to generate clinical summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Book className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Clinical Reference</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Knowledge Library</h1>
              <p className="text-slate-500 mt-2 font-medium">Access high-yield clinical protocols and disease databases.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">{bookmarked.length} Saved Items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sidebar: Navigation & Search */}
          <div className="lg:col-span-4 space-y-8">
            {/* Search Box */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search diseases, symptoms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:border-indigo-600 outline-none transition-all shadow-sm font-medium"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    selectedCategory === cat 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                      : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Disease List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {filtered.length} Results Found
                </span>
              </div>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {filtered.length > 0 ? (
                  filtered.map((d) => (
                    <button
                      key={d.name}
                      onClick={() => {
                        setSelected(d);
                        setAiSummary(null);
                      }}
                      className={`w-full text-left px-6 py-5 border-b border-slate-50 last:border-none transition-all flex items-center justify-between group ${
                        selected.name === d.name ? "bg-indigo-50/50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className={`font-black text-sm tracking-tight ${selected.name === d.name ? "text-indigo-600" : "text-slate-900"}`}>
                          {d.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.category}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selected.name === d.name ? "text-indigo-600 translate-x-1" : "text-slate-300 group-hover:translate-x-1"}`} />
                    </button>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm font-bold">No diseases found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content: Detailed View */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
              >
                {/* Detail Header */}
                <div className="p-10 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center text-white">
                        <Stethoscope className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                            {selected.category}
                          </span>
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{selected.name}</h2>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => toggleBookmark(selected.name)}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        bookmarked.includes(selected.name)
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      {bookmarked.includes(selected.name) ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
                    </button>
                  </div>

                  {/* Clinical Pearl Box */}
                  <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-100">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Clinical Pearl</span>
                      <p className="text-amber-900 font-bold leading-relaxed">{selected.pearl}</p>
                    </div>
                  </div>
                </div>

                {/* Detail Content Grid */}
                <div className="p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-10">
                      <Section icon={<Info className="w-5 h-5 text-indigo-600" />} title="Clinical Presentation">
                        <div className="grid grid-cols-1 gap-3">
                          {selected.symptoms.map(s => (
                            <div key={s} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-bold text-sm">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                              {s}
                            </div>
                          ))}
                        </div>
                      </Section>

                      <Section icon={<Shield className="w-5 h-5 text-emerald-600" />} title="Risk Factors">
                        <div className="flex flex-wrap gap-2">
                          {selected.risk_factors.map(r => (
                            <span key={r} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-100">
                              {r}
                            </span>
                          ))}
                        </div>
                      </Section>
                    </div>

                    <div className="space-y-10">
                      <Section icon={<Activity className="w-5 h-5 text-rose-600" />} title="Diagnostic Workup">
                        <div className="space-y-3">
                          {selected.tests.map(t => (
                            <div key={t} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                              <span className="text-sm font-black text-rose-900">{t}</span>
                              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-rose-300" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>

                      <Section icon={<Book className="w-5 h-5 text-slate-900" />} title="Management Protocol">
                        <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200">
                          <p className="text-sm font-medium leading-relaxed opacity-90">
                            {selected.treatment}
                          </p>
                        </div>
                      </Section>
                    </div>
                  </div>

                  {/* AI Summary Section */}
                  <div className="mt-12 pt-12 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">AI Clinical Summary</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Powered by Gemini 3.1</p>
                        </div>
                      </div>
                      
                      {!aiSummary && !isGenerating && (
                        <button 
                          onClick={generateAiSummary}
                          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Summary
                        </button>
                      )}
                    </div>

                    {isGenerating && (
                      <div className="p-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-bold text-sm">Analyzing clinical data and generating high-yield summary...</p>
                      </div>
                    )}

                    {aiSummary && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100"
                      >
                        <div className="prose prose-slate prose-sm max-w-none text-indigo-900 font-medium leading-relaxed whitespace-pre-wrap">
                          {aiSummary}
                        </div>
                        <div className="mt-6 flex justify-end">
                          <button 
                            onClick={() => setAiSummary(null)}
                            className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                          >
                            Clear Summary
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
