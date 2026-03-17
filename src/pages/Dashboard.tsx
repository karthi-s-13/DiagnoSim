import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { PatientCase, UserProfile } from "../types";
import { Plus, Clock, ChevronRight, Activity, AlertCircle, Lock, Unlock, Trophy, Calendar, X, BookOpen, Flame } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { geminiService } from "../services/gemini";
import curriculumData from "../data/curriculum.json";
import { DISEASE_DATA } from "../data/diseases";

export default function Dashboard() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicalTerm, setMedicalTerm] = useState<{ term: string; definition: string } | null>(null);
  const [isGeneratingTerm, setIsGeneratingTerm] = useState(false);
  const [showTermDefinition, setShowTermDefinition] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchMedicalTerm();
  }, []);

  const fetchMedicalTerm = async (force = false) => {
    // Check cache first
    const cached = localStorage.getItem("medical_term_cache");
    if (cached && !force) {
      const { term, timestamp } = JSON.parse(cached);
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp < oneDay) {
        setMedicalTerm(term);
        return;
      }
    }

    setIsGeneratingTerm(true);
    try {
      const term = await geminiService.generateMedicalTerm();
      setMedicalTerm(term);
      localStorage.setItem("medical_term_cache", JSON.stringify({
        term,
        timestamp: Date.now()
      }));
    } catch (err) {
      // Error is already handled/silenced in geminiService fallback
    } finally {
      setIsGeneratingTerm(false);
    }
  };

  const fetchData = async () => {
    if (!auth.currentUser) return;
    try {
      // Fetch User Profile
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
      }

      // Fetch Cases
      const q = query(
        collection(db, "cases"),
        where("studentId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const casesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientCase));
      setCases(casesData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const startCurriculumCase = async (level: number, disease: string) => {
    if (!auth.currentUser || !userProfile) return;
    if (level > (userProfile.unlockedLevel || 1)) return;

    setIsStarting(true);
    setError(null);
    try {
      const caseData = await geminiService.generateCase(disease);
      
      const docRef = await addDoc(collection(db, "cases"), {
        ...caseData,
        diseaseId: disease,
        studentId: auth.currentUser.uid,
        status: "active",
        type: "curriculum",
        level,
        chatLimit: 10 + (level * 2), // Increasing difficulty
        chatCount: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate(`/simulation/${docRef.id}`);
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("The AI service is currently busy. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to start simulation.");
      }
      setIsStarting(false);
    }
  };

  const startDailyChallenge = async () => {
    if (!auth.currentUser) return;
    setIsStarting(true);
    setError(null);
    try {
      // Check if daily challenge already exists for today
      const today = format(new Date(), "yyyy-MM-dd");
      const q = query(
        collection(db, "cases"),
        where("studentId", "==", auth.currentUser.uid),
        where("type", "==", "daily"),
        where("createdAt", ">=", today)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        navigate(`/simulation/${snap.docs[0].id}`);
        return;
      }

      const randomDisease = curriculumData[Math.floor(Math.random() * curriculumData.length)].disease;
      const caseData = await geminiService.generateCase(randomDisease);
      
      const docRef = await addDoc(collection(db, "cases"), {
        ...caseData,
        diseaseId: randomDisease,
        studentId: auth.currentUser.uid,
        status: "active",
        type: "daily",
        chatLimit: 15,
        chatCount: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate(`/simulation/${docRef.id}`);
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("The AI service is currently busy. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to start daily challenge.");
      }
      setIsStarting(false);
    }
  };

  const startPracticeCase = async (disease: string) => {
    if (!auth.currentUser) return;
    setIsStarting(true);
    setError(null);
    setIsStarting(true);
    setError(null);
    setShowPracticeModal(false);
    try {
      const caseData = await geminiService.generateCase(disease);
      
      const docRef = await addDoc(collection(db, "cases"), {
        ...caseData,
        diseaseId: disease,
        studentId: auth.currentUser.uid,
        status: "active",
        type: "practice",
        chatLimit: 20, // Practice sessions have more questions
        chatCount: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate(`/simulation/${docRef.id}`);
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("The AI service is currently busy. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to start practice session.");
      }
      setIsStarting(false);
    }
  };

  const unlockedLevel = userProfile?.unlockedLevel || 1;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Medical Simulation Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, Dr. {auth.currentUser?.displayName?.split(" ")[0]}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPracticeModal(true)}
            disabled={isStarting}
            className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Start Practice Session
          </button>
          <button
            onClick={startDailyChallenge}
            disabled={isStarting}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-100 disabled:opacity-50"
          >
            <Calendar className="w-5 h-5" />
            Daily Challenge
          </button>
          {error && <p className="text-rose-600 text-xs font-medium">{error}</p>}
        </div>
      </div>

      {/* Practice Modal */}
      {showPracticeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Select Disease for Practice</h3>
              <button onClick={() => setShowPracticeModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-2">
              {DISEASE_DATA.map((disease) => (
                <button
                  key={disease.name}
                  onClick={() => startPracticeCase(disease.name)}
                  className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-between group"
                >
                  <span className="font-bold text-slate-700 group-hover:text-indigo-700">{disease.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                </button>
              ))}
            </div>
            <div className="p-6 bg-slate-50 text-center">
              <p className="text-xs text-slate-400">Practice sessions do not count towards curriculum progress.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Learning Path */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <Trophy className="w-5 h-5 text-indigo-600" />
              Curriculum Progression
            </div>
            <div className="text-sm font-medium text-slate-500">
              Level {unlockedLevel} / 50
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {curriculumData.slice(0, Math.min(unlockedLevel + 2, 50)).map((item) => {
              const isLocked = item.level > unlockedLevel;
              const isCompleted = item.level < unlockedLevel;

              return (
                <div
                  key={item.level}
                  onClick={() => !isLocked && startCurriculumCase(item.level, item.disease)}
                  className={`p-6 rounded-2xl border transition-all relative overflow-hidden group ${
                    isLocked 
                      ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed" 
                      : "bg-white border-slate-100 shadow-sm hover:shadow-md cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isLocked ? 'text-slate-400' : 'text-indigo-600'}`}>
                      Level {item.level}
                    </span>
                    {isLocked ? <Lock className="w-4 h-4 text-slate-400" /> : isCompleted ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />}
                  </div>
                  <h3 className={`font-bold text-lg ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>{item.title}</h3>
                  <p className={`text-sm mt-1 line-clamp-2 ${isLocked ? 'text-slate-300' : 'text-slate-500'}`}>{item.description}</p>
                  
                  {!isLocked && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start Simulation <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Recent Activity & Stats */}
        <div className="space-y-6">
          {/* Medical Term of the Day */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Term of the Day
              </h3>
              <button 
                onClick={() => fetchMedicalTerm(true)}
                disabled={isGeneratingTerm}
                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                title="Generate New Term"
              >
                <Plus className={`w-4 h-4 text-slate-400 ${isGeneratingTerm ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {medicalTerm ? (
              <div className="space-y-3">
                <button 
                  onClick={() => setShowTermDefinition(!showTermDefinition)}
                  className="w-full text-left p-4 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all group/term"
                >
                  <div className="text-indigo-700 font-black text-lg tracking-tight group-hover/term:scale-[1.02] transition-transform">
                    {medicalTerm.term}
                  </div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                    Click to {showTermDefinition ? 'hide' : 'reveal'} definition
                  </div>
                </button>
                
                {showTermDefinition && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                      {medicalTerm.definition}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">Learning Progress</h3>
            <div className="space-y-8">
              <StatItem label="Total Cases" value={cases.length.toString()} />
              <StatItem label="Curriculum" value={`${Math.round(((unlockedLevel - 1) / 50) * 100)}%`} />
              <div className="flex items-center gap-4">
                <StatItem label="Daily Streak" value={`${userProfile?.streak || 0} days`} />
                {(userProfile?.streak || 0) > 0 && (
                  <div className="bg-amber-500/20 p-2 rounded-full">
                    <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Recent History
              </h3>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <FilterButton active={filterType === 'all'} label="All Types" onClick={() => setFilterType('all')} />
                <FilterButton active={filterType === 'curriculum'} label="Curriculum" onClick={() => setFilterType('curriculum')} />
                <FilterButton active={filterType === 'daily'} label="Daily" onClick={() => setFilterType('daily')} />
                <FilterButton active={filterType === 'practice'} label="Practice" onClick={() => setFilterType('practice')} />
              </div>
              <div className="flex items-center gap-2">
                <FilterButton active={filterStatus === 'all'} label="All Status" onClick={() => setFilterStatus('all')} />
                <FilterButton active={filterStatus === 'active'} label="Active" onClick={() => setFilterStatus('active')} />
                <FilterButton active={filterStatus === 'completed'} label="Completed" onClick={() => setFilterStatus('completed')} />
              </div>
            </div>

            <div className="space-y-4">
              {cases
                .filter(c => (filterType === 'all' || c.type === filterType) && (filterStatus === 'all' || c.status === filterStatus))
                .slice(0, 8)
                .map(c => (
                <div 
                  key={c.id} 
                  onClick={() => {
                    if (c.status === 'completed') {
                      if (c.lastAttemptId) {
                        navigate(`/result/${c.lastAttemptId}`);
                      } else {
                        // Fallback for older cases or if attempt ID is missing
                        navigate(`/simulation/${c.id}`);
                      }
                    } else {
                      navigate(`/simulation/${c.id}`);
                    }
                  }} 
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{c.patientName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{c.type}</div>
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${
                        c.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                        {c.status}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              {cases.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 font-medium italic">No clinical history yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
        active 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}
