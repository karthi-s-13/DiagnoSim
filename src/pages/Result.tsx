import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { StudentAttempt, PatientCase } from "../types";
import { CheckCircle2, AlertCircle, TrendingUp, Target, Award, Clock, ChevronLeft, BarChart3, MessageSquare, FlaskConical, ClipboardCheck, Flame, FileText, Printer } from "lucide-react";
import { motion } from "motion/react";

export default function Result() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [patientCase, setPatientCase] = useState<PatientCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!attemptId || !auth.currentUser) return;
      try {
        const attemptRef = doc(db, "attempts", attemptId);
        const attemptSnap = await getDoc(attemptRef);
        
        if (attemptSnap.exists()) {
          const attemptData = attemptSnap.data();
          setAttempt({ id: attemptSnap.id, ...attemptData });
          
          // Fetch case info for context
          const caseRef = doc(db, "cases", attemptData.caseId);
          const caseSnap = await getDoc(caseRef);
          if (caseSnap.exists()) {
            setPatientCase({ id: caseSnap.id, ...caseSnap.data() } as PatientCase);
          }
        }
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [attemptId, auth.currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Result Not Found</h2>
        <p className="text-slate-500 mb-6 text-center">We couldn't find the evaluation for this attempt.</p>
        <Link to="/dashboard" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] print:bg-white pb-20 font-sans">
      {/* Clinical Report Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm print:shadow-none print:static">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="group p-2.5 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all print:hidden">
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
            </Link>
            <div className="h-10 w-[1px] bg-slate-200 hidden sm:block print:hidden"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-2 py-0.5 rounded-md">Official Report</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID: {attemptId?.slice(0, 8)}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Diagnostic Performance Summary</h1>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3 print:hidden">
            <button 
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          {/* Left Column: Primary Results */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Verdict Card */}
            <div className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 print:shadow-none print:border-slate-300">
              <div className={`absolute top-0 left-0 right-0 h-2 ${attempt.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div className="p-10">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  {/* Score Gauge */}
                  <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-slate-100"
                      />
                      <motion.circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={552.92}
                        initial={{ strokeDashoffset: 552.92 }}
                        animate={{ strokeDashoffset: 552.92 - (552.92 * attempt.score) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={attempt.isCorrect ? 'text-emerald-500' : 'text-rose-500'}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">{attempt.score}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy</span>
                    </div>
                  </div>

                  {/* Verdict Info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ${
                      attempt.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {attempt.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        {attempt.isCorrect ? 'Clinical Success' : 'Diagnostic Error'}
                      </span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-none">
                      {attempt.isCorrect ? 'Diagnosis Confirmed' : 'Diagnosis Rejected'}
                    </h2>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Submission</span>
                        <span className={`text-lg font-bold ${attempt.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {attempt.diagnosis}
                        </span>
                      </div>
                      
                      {!attempt.isCorrect && (
                        <div className="flex flex-col gap-1 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Correct Diagnosis</span>
                          <span className="text-xl font-black text-indigo-700">
                            {patientCase?.diseaseId}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-500 text-lg leading-relaxed font-medium">
                      {attempt.isCorrect 
                        ? "Your clinical reasoning aligns with the standard of care for this presentation."
                        : "The submitted diagnosis does not match the clinical evidence provided in this case."}
                    </p>
                    
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Elapsed</div>
                        <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          {Math.floor(attempt.timeSpent / 60)}:{(attempt.timeSpent % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Case Severity</div>
                        <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="capitalize">{patientCase?.severity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Educator Feedback */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  Educator Feedback
                </h3>
              </div>
              <div className="p-10">
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-indigo-100 rounded-full"></div>
                  <p className="text-slate-600 text-lg leading-relaxed font-medium italic pl-6">
                    "{attempt.feedback}"
                  </p>
                </div>
              </div>
            </div>

            {/* Clinical Notes */}
            {attempt.notes && (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                      <FileText className="w-4 h-4" />
                    </div>
                    Your Clinical Notes
                  </h3>
                </div>
                <div className="p-10">
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                    <p className="text-slate-700 text-base leading-relaxed font-medium whitespace-pre-wrap">
                      {attempt.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Differential Analysis */}
            {attempt.differentialDiagnosis && attempt.differentialDiagnosis.length > 0 && (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    Differential Analysis
                  </h3>
                </div>
                <div className="p-10">
                  <p className="text-slate-500 mb-8 font-medium">The following conditions should have been prioritized in your differential based on the patient's presentation:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {attempt.differentialDiagnosis.map((d: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 group hover:bg-amber-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-600 font-black text-xs">
                          {i + 1}
                        </div>
                        <span className="font-bold text-amber-900">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Detailed Metrics & Case Info */}
          <div className="lg:col-span-4 space-y-8">
            {/* Performance Breakdown */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Competency Breakdown
              </h3>
              <div className="space-y-8">
                <MetricBar label="Diagnostic Accuracy" value={attempt.metrics.accuracy} color="bg-emerald-500" />
                <MetricBar label="Clinical Reasoning" value={attempt.metrics.reasoning} color="bg-indigo-500" />
                <MetricBar label="Diagnostic Efficiency" value={attempt.metrics.efficiency} color="bg-amber-500" />
                <MetricBar label="Communication" value={attempt.metrics.communication} color="bg-rose-500" />
              </div>
            </div>

            {/* Case Reference */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-white/60" />
                Case Reference
              </h3>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Patient Profile</span>
                  <span className="text-xl font-black">{patientCase?.patientName}</span>
                </div>
                
                <div className="h-[1px] bg-white/10"></div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Final Diagnosis</span>
                  <span className="text-xl font-black text-indigo-400">{patientCase?.diseaseId}</span>
                </div>

                <div className="h-[1px] bg-white/10"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Severity</span>
                    <span className="text-sm font-black uppercase tracking-wider">{patientCase?.severity}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Category</span>
                    <span className="text-sm font-black uppercase tracking-wider">Internal Med</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate("/dashboard")}
              className="group w-full bg-white border-2 border-slate-900 text-slate-900 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-slate-200 print:hidden"
            >
              Return to Dashboard
              <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-600">{label}</span>
        <span className="text-xs font-black text-slate-900">{value}/10</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
