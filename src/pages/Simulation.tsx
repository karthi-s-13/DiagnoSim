import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import { PatientCase, ChatMessage, TestResult, UserProfile } from "../types";
import { geminiService } from "../services/gemini";
import { Send, Activity, FlaskConical, ClipboardCheck, User, Info, AlertCircle, CheckCircle2, ChevronLeft, Timer, Play, Terminal, FileText, BarChart3, Flame, MessageSquare, Lightbulb, Thermometer, Heart, Droplets, Wind } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { isYesterday, isSameDay, parseISO } from "date-fns";

export default function Simulation() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [patientCase, setPatientCase] = useState<PatientCase | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRequestingTest, setIsRequestingTest] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleTask = async (taskId: string) => {
    if (!caseId || !patientCase || !patientCase.tasks) return;
    
    const updatedTasks = patientCase.tasks.map(task => 
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );

    setPatientCase({ ...patientCase, tasks: updatedTasks });
    await updateDoc(doc(db, "cases", caseId), { tasks: updatedTasks });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);

    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    
    notesTimeoutRef.current = setTimeout(async () => {
      if (caseId) {
        await updateDoc(doc(db, "cases", caseId), { notes: newNotes });
      }
    }, 1000);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (patientCase?.status === 'active') {
        setSeconds(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [patientCase?.status]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!caseId) return;
    
    const fetchCase = async () => {
      const docRef = doc(db, "cases", caseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as PatientCase;
        setPatientCase({ id: docSnap.id, ...data });
        if (data.notes) setNotes(data.notes);
      }
    };
    fetchCase();

    const qMessages = query(collection(db, "cases", caseId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    });

    const qTests = query(collection(db, "cases", caseId, "tests"), orderBy("timestamp", "desc"));
    const unsubscribeTests = onSnapshot(qTests, (snapshot) => {
      setTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult)));
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTests();
    };
  }, [caseId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!caseId || !patientCase) return;
    if (patientCase.chatCount >= patientCase.chatLimit) return;

    await addDoc(collection(db, "cases", caseId, "messages"), {
      caseId,
      role: "student",
      content,
      timestamp: new Date().toISOString()
    });

    await updateDoc(doc(db, "cases", caseId), {
      chatCount: patientCase.chatCount + 1
    });

    setIsTyping(true);
    try {
      const patientResponse = await geminiService.getPatientResponse(patientCase, messages, content);
      await addDoc(collection(db, "cases", caseId, "messages"), {
        caseId,
        role: "patient",
        content: patientResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Patient response failed", error);
      const errorMessage = (error.message?.includes("429") || error.message?.includes("quota"))
        ? "The patient is currently unable to respond (Service Busy). Please try again in a few seconds."
        : "The patient seems unable to respond right now...";
        
      await addDoc(collection(db, "cases", caseId, "messages"), {
        caseId,
        role: "patient",
        content: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const studentMsg = input;
    setInput("");
    await sendMessage(studentMsg);
  };

  const requestTest = async (testType: string) => {
    if (!caseId || !patientCase) return;
    setIsRequestingTest(true);
    try {
      const result = await geminiService.generateTestResult(patientCase, patientCase.diseaseId, testType);
      await addDoc(collection(db, "cases", caseId, "tests"), {
        caseId,
        testType,
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Test request failed", error);
      const errorMessage = (error.message?.includes("429") || error.message?.includes("quota"))
        ? "Lab service is currently overwhelmed. Please try again in a moment."
        : "The lab was unable to process this request.";
        
      await addDoc(collection(db, "cases", caseId, "messages"), {
        caseId,
        role: "patient",
        content: `[LAB ALERT]: ${errorMessage}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRequestingTest(false);
    }
  };

  const submitDiagnosis = async () => {
    if (!caseId || !patientCase || !diagnosis.trim()) return;
    setIsSubmitting(true);
    try {
      const evalResult = await geminiService.evaluateDiagnosis(
        patientCase, 
        patientCase.diseaseId, 
        diagnosis,
        messages,
        tests,
        notes
      );
      
      const attemptRef = await addDoc(collection(db, "attempts"), {
        userId: auth.currentUser?.uid,
        caseId,
        diagnosis,
        notes,
        ...evalResult,
        timestamp: new Date().toISOString(),
        timeSpent: seconds
      });

      await updateDoc(doc(db, "cases", caseId), { 
        status: "completed",
        lastAttemptId: attemptRef.id
      });

      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data() as UserProfile;
          const updates: any = {};

          const now = new Date();
          const lastDate = userData.lastActivityDate ? parseISO(userData.lastActivityDate) : null;
          
          if (!lastDate) {
            updates.streak = 1;
            updates.lastActivityDate = now.toISOString();
          } else if (isYesterday(lastDate)) {
            updates.streak = (userData.streak || 0) + 1;
            updates.lastActivityDate = now.toISOString();
          } else if (!isSameDay(lastDate, now)) {
            updates.streak = 1;
            updates.lastActivityDate = now.toISOString();
          }

          if (evalResult.isCorrect && patientCase.type === 'curriculum') {
            const currentUnlocked = userData.unlockedLevel || 1;
            if (patientCase.level === currentUnlocked) {
              updates.unlockedLevel = currentUnlocked + 1;
            }
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
          }
        }
      }

      navigate(`/result/${attemptRef.id}`);

    } catch (error: any) {
      console.error("Diagnosis submission failed", error);
      const errorMessage = (error.message?.includes("429") || error.message?.includes("quota"))
        ? "The evaluation service is currently busy. Please wait a moment and try again."
        : "Failed to submit diagnosis. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patientCase) return null;

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      {/* Clinical Dashboard Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sm:py-4 z-30 shadow-sm shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link to="/dashboard" className="p-2 sm:p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 shrink-0">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">{patientCase.patientName}</h1>
                <div className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border ${
                  patientCase.severity === 'severe' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  patientCase.severity === 'moderate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {patientCase.severity}
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 mt-0.5 sm:mt-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 flex items-center gap-1 sm:gap-1.5">
                  <User className="w-3 h-3" /> {patientCase.age}Y • {patientCase.gender}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 hidden xs:flex items-center gap-1 sm:gap-1.5">
                  <Activity className="w-3 h-3" /> ID: {caseId?.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <button
              onClick={() => setIsNotesOpen(true)}
              className="p-2 sm:p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600 flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">Notebook</span>
            </button>

            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-2 text-indigo-600 mb-0.5">
                <Timer className="w-4 h-4" />
                <span className="text-lg font-black font-mono tracking-tighter">{formatTime(seconds)}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Elapsed Time</span>
            </div>
            
            <button 
              onClick={submitDiagnosis}
              disabled={patientCase.status === 'completed' || isSubmitting || !diagnosis.trim()}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl shadow-slate-200 flex items-center gap-2 sm:gap-3 group"
            >
              <span className="hidden xs:inline">{isSubmitting ? "Processing..." : "Submit Diagnosis"}</span>
              <span className="xs:hidden">{isSubmitting ? "..." : "Submit"}</span>
              <ClipboardCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 overflow-hidden min-h-0">
        {/* Left: Patient Data & Tasks - Scrollable on desktop, top on mobile */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-0 lg:pr-2 min-h-0">
          {/* Vitals Card */}
          <section className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 p-5 sm:p-8 shadow-sm">
            <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              Current Vitals
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <Thermometer className="w-3 h-3 text-orange-500" /> Temp
                </div>
                <div className="text-sm font-black text-slate-900">{patientCase.vitals.temp}°C</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <Activity className="w-3 h-3 text-indigo-500" /> BP
                </div>
                <div className="text-sm font-black text-slate-900">{patientCase.vitals.bp}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <Heart className="w-3 h-3 text-rose-500" /> HR
                </div>
                <div className="text-sm font-black text-slate-900">{patientCase.vitals.heartRate} <span className="text-[10px] text-slate-400">bpm</span></div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <Wind className="w-3 h-3 text-sky-500" /> RR
                </div>
                <div className="text-sm font-black text-slate-900">{patientCase.vitals.respRate} <span className="text-[10px] text-slate-400">/min</span></div>
              </div>
              <div className="col-span-2 space-y-1 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <Droplets className="w-3 h-3 text-blue-500" /> SpO2
                </div>
                <div className="text-sm font-black text-slate-900">{patientCase.vitals.o2}% <span className="text-[10px] text-slate-400">on Room Air</span></div>
              </div>
            </div>
          </section>

          {/* Patient Card */}
          <section className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 p-5 sm:p-8 shadow-sm">
            <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Clinical Presentation
            </h3>
            
            <div className="space-y-4 sm:space-y-8">
              <div>
                <h4 className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 sm:mb-2">Chief Complaint</h4>
                <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight italic">
                  "{patientCase.chiefComplaint}"
                </p>
              </div>
              
              <div className="h-[1px] bg-slate-100"></div>
              
              <div className="hidden sm:block">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Medical History</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {patientCase.history}
                </p>
              </div>
            </div>
          </section>

          {/* Diagnostic Tasks List */}
          <section className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 p-5 sm:p-8 shadow-sm">
            <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-indigo-600" />
              Diagnostic Tasks
            </h3>
            <div className="space-y-2">
              {patientCase.tasks?.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  disabled={patientCase.status === 'completed'}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    task.isCompleted 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    task.isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'bg-white border-slate-200'
                  }`}>
                    {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-bold leading-tight ${task.isCompleted ? 'line-through opacity-60' : ''}`}>
                    {task.description}
                  </span>
                </button>
              ))}
              {(!patientCase.tasks || patientCase.tasks.length === 0) && (
                <p className="text-[10px] text-slate-400 font-medium italic text-center py-4">
                  No specific tasks defined for this case.
                </p>
              )}
            </div>
          </section>

          {/* Diagnostic Orders - Hidden on mobile, accessible via button maybe? Or just keep it. */}
          <section className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              Diagnostics
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <TestButton label="Complete Blood Count" onClick={() => requestTest("CBC")} disabled={isRequestingTest || patientCase.status === 'completed'} />
              <TestButton label="Liver Function Test" onClick={() => requestTest("LFT")} disabled={isRequestingTest || patientCase.status === 'completed'} />
              <TestButton label="Chest X-Ray" onClick={() => requestTest("CXR")} disabled={isRequestingTest || patientCase.status === 'completed'} />
              <TestButton label="Malaria Parasite" onClick={() => requestTest("MP")} disabled={isRequestingTest || patientCase.status === 'completed'} />
            </div>
          </section>
        </div>

        {/* Middle: Interaction Console - Main focus */}
        <div className="lg:col-span-6 flex flex-col gap-6 min-h-0 flex-1">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 flex-1 flex flex-col shadow-sm overflow-hidden min-h-0">
            <div className="px-6 sm:px-8 py-3 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Patient Interview</h3>
              </div>
              <div className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black tracking-widest border transition-all duration-500 ${
                patientCase.chatCount >= patientCase.chatLimit 
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-200' 
                  : patientCase.chatCount >= patientCase.chatLimit - 3
                  ? 'bg-amber-500 text-white border-amber-300'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}>
                QUERIES: {patientCase.chatCount} / {patientCase.chatLimit}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
              <AnimatePresence>
                {patientCase.chatCount >= patientCase.chatLimit - 3 && patientCase.status === 'active' && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: patientCase.chatCount >= patientCase.chatLimit ? [1, 1.02, 1] : 1
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      scale: { repeat: Infinity, duration: 2 },
                      default: { duration: 0.3 }
                    }}
                    className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-4 flex items-center gap-3 sm:gap-5 shadow-2xl ${
                      patientCase.chatCount >= patientCase.chatLimit
                        ? 'bg-rose-600 border-rose-400 text-white shadow-rose-200'
                        : 'bg-amber-500 border-amber-300 text-white shadow-amber-100'
                    }`}
                  >
                    <div className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl shrink-0">
                      <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] mb-0.5 sm:mb-1">
                        {patientCase.chatCount >= patientCase.chatLimit ? 'System Lockout' : 'Clinical Efficiency Warning'}
                      </p>
                      <p className="text-sm sm:text-lg font-black leading-tight">
                        {patientCase.chatCount >= patientCase.chatLimit
                          ? "Maximum clinical queries reached. Formulate your final diagnosis now."
                          : `Efficiency decreasing. Only ${patientCase.chatLimit - patientCase.chatCount} diagnostic queries remaining.`}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
                  <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12" />
                  <p className="text-xs sm:text-sm font-bold">Start the interview by asking a question</p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] sm:max-w-[85%] p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] text-xs sm:text-sm font-medium leading-relaxed shadow-sm ${
                    msg.role === 'student' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] rounded-tl-none border border-slate-200 flex gap-1.5">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 sm:p-6 bg-white border-t border-slate-100 flex gap-3 sm:gap-4 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={patientCase.chatCount >= patientCase.chatLimit ? "Query limit reached" : "Type your question..."}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none disabled:opacity-50 placeholder:text-slate-400"
                disabled={patientCase.status === 'completed' || patientCase.chatCount >= patientCase.chatLimit}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || patientCase.status === 'completed' || patientCase.chatCount >= patientCase.chatLimit}
                className="bg-indigo-600 text-white px-5 sm:px-8 rounded-xl sm:rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 font-black text-xs sm:text-sm shadow-lg shadow-indigo-100 flex items-center justify-center"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Results & Final Input - Hidden on mobile, or at bottom */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pl-0 lg:pl-2 min-h-0">
          {/* Lab Results Card */}
          <section className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 p-5 sm:p-8 shadow-sm">
            <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Lab Investigations
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {tests.map((test) => (
                <div key={test.id} className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                    <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{test.testType}</div>
                    {test.isAbnormal && <div className="w-2 h-2 bg-rose-500 rounded-full shadow-sm shadow-rose-200"></div>}
                  </div>
                  <div className={`text-sm sm:text-base font-black ${test.isAbnormal ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {test.resultValue}
                  </div>
                </div>
              ))}
              {tests.length === 0 && (
                <div className="text-center py-8 sm:py-12 border-2 border-dashed border-slate-100 rounded-[1.25rem] sm:rounded-[1.5rem]">
                  <FlaskConical className="w-6 h-6 sm:w-8 sm:h-8 text-slate-200 mx-auto mb-2 sm:mb-3" />
                  <p className="text-[10px] sm:text-xs font-bold text-slate-300">No investigations ordered</p>
                </div>
              )}
            </div>
          </section>

          {/* Final Diagnosis */}
          <section className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 p-5 sm:p-8 shadow-sm flex-1 flex flex-col min-h-[200px] lg:min-h-0">
            <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Clinical Impression
            </h3>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Provide your final diagnosis..."
              className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-xs sm:text-sm font-medium leading-relaxed focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none placeholder:text-slate-300"
            />
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-indigo-50 rounded-xl sm:rounded-2xl border border-indigo-100">
              <p className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center">
                Submit in header when ready.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Clinical Notebook Slide-over */}
      <AnimatePresence>
        {isNotesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotesOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Clinical Notebook</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Auto-saving enabled</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsNotesOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-500 rotate-180" />
                </button>
              </div>
              
              <div className="flex-1 p-6 flex flex-col gap-4">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-900 font-medium leading-relaxed">
                    Use this space to track findings, differential diagnoses, and clinical reasoning. These notes will be included in your final evaluation.
                  </p>
                </div>
                
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Start typing your clinical observations..."
                  className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-medium leading-relaxed focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none custom-scrollbar"
                />
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setIsNotesOpen(false)}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Close Notebook
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TestButton({ label, onClick, disabled }: { label: string, onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left px-5 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-indigo-600 hover:text-white border border-slate-100 hover:border-indigo-600 transition-all disabled:opacity-50 flex items-center justify-between group"
    >
      {label}
      <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
    </button>
  );
}
