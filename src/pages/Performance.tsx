import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { StudentAttempt, UserProfile } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp, Target, Award, Clock, Flame, BarChart3, AlertTriangle, History, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function Performance() {
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      // Fetch User Profile
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
      }

      const q = query(
        collection(db, "attempts"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const attemptData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentAttempt));
      setAttempts(attemptData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const chartData = [...attempts].reverse().map(a => ({
    date: format(new Date(a.timestamp), "MMM d"),
    score: a.score
  }));

  // Calculate Average Metrics for Radar Chart
  const avgMetrics = attempts.length > 0 ? {
    accuracy: Math.round(attempts.reduce((acc, curr) => acc + (curr.metrics?.accuracy || 0), 0) / attempts.length),
    reasoning: Math.round(attempts.reduce((acc, curr) => acc + (curr.metrics?.reasoning || 0), 0) / attempts.length),
    efficiency: Math.round(attempts.reduce((acc, curr) => acc + (curr.metrics?.efficiency || 0), 0) / attempts.length),
    communication: Math.round(attempts.reduce((acc, curr) => acc + (curr.metrics?.communication || 0), 0) / attempts.length),
  } : { accuracy: 0, reasoning: 0, efficiency: 0, communication: 0 };

  const radarData = [
    { subject: 'Accuracy', A: avgMetrics.accuracy, fullMark: 10 },
    { subject: 'Reasoning', A: avgMetrics.reasoning, fullMark: 10 },
    { subject: 'Efficiency', A: avgMetrics.efficiency, fullMark: 10 },
    { subject: 'Communication', A: avgMetrics.communication, fullMark: 10 },
  ];

  // Identify Weak Areas (Diseases with low scores)
  const diseasePerformance: Record<string, { total: number, count: number }> = {};
  attempts.forEach(a => {
    if (!diseasePerformance[a.caseId]) {
      diseasePerformance[a.caseId] = { total: 0, count: 0 };
    }
    diseasePerformance[a.caseId].total += a.score;
    diseasePerformance[a.caseId].count += 1;
  });

  const weakAreas = Object.entries(diseasePerformance)
    .map(([caseId, stats]) => ({
      caseId,
      avgScore: Math.round(stats.total / stats.count)
    }))
    .filter(area => area.avgScore < 70)
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 3);

  const avgScore = attempts.length > 0 
    ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length)
    : 0;

  const correctCount = attempts.filter(a => a.isCorrect).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Performance Analytics</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">Detailed breakdown of your clinical competency and growth.</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-3xl"></div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-slate-900 font-black text-2xl tracking-tight">No performance data yet</h3>
          <p className="text-slate-500 mt-2 text-lg font-medium max-w-md mx-auto">Complete your first simulation to unlock detailed analytics and track your diagnostic growth.</p>
          <Link to="/dashboard" className="mt-8 inline-flex bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
            Start First Case
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard 
              icon={<Target className="w-6 h-6 text-indigo-600" />}
              label="Avg. Accuracy"
              value={`${avgScore}%`}
              color="indigo"
            />
            <StatCard 
              icon={<Award className="w-6 h-6 text-emerald-600" />}
              label="Correct Diagnoses"
              value={correctCount.toString()}
              color="emerald"
            />
            <StatCard 
              icon={<TrendingUp className="w-6 h-6 text-rose-600" />}
              label="Total Attempts"
              value={attempts.length.toString()}
              color="rose"
            />
            <StatCard 
              icon={<Clock className="w-6 h-6 text-amber-600" />}
              label="Success Rate"
              value={`${Math.round((correctCount / attempts.length) * 100)}%`}
              color="amber"
            />
            <StatCard 
              icon={<Flame className="w-6 h-6 text-orange-600" />}
              label="Current Streak"
              value={`${userProfile?.streak || 0} Days`}
              color="orange"
            />
          </div>

          {/* Main Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Competency Radar & Score Progression */}
            <div className="lg:col-span-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Radar Chart */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                      <Target className="w-4 h-4" />
                    </div>
                    Competency Radar
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                        <Radar
                          name="Competency"
                          dataKey="A"
                          stroke="#4f46e5"
                          fill="#4f46e5"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Weak Areas */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center text-white">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    Growth Opportunities
                  </h3>
                  <div className="space-y-4">
                    {weakAreas.length > 0 ? weakAreas.map((area, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-black text-rose-900 uppercase tracking-tight">{area.caseId}</div>
                          <div className="text-xs font-bold text-rose-500 uppercase tracking-widest">Avg. Score: {area.avgScore}%</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-600 shadow-sm">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center bg-emerald-50 border border-emerald-100 rounded-3xl">
                        <Award className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm font-bold text-emerald-900">No weak areas identified. Excellent consistency!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Score Progression Chart */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  Score Progression
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#4f46e5" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                        activeDot={{ r: 10, strokeWidth: 4, stroke: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="lg:col-span-4">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                    <History className="w-4 h-4" />
                  </div>
                  Recent Activity
                </h3>
                <div className="space-y-6">
                  {attempts.slice(0, 5).map((attempt, i) => (
                    <Link 
                      key={attempt.id} 
                      to={`/result/${attempt.id}`}
                      className="flex items-start gap-4 group"
                    >
                      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black text-xs ${
                        attempt.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {attempt.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                          {attempt.diagnosis}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {format(new Date(attempt.timestamp), "MMM d, h:mm a")}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors self-center" />
                    </Link>
                  ))}
                </div>
                <button className="w-full mt-10 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-200 hover:text-slate-600 transition-all">
                  View Full History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{value}</div>
      <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{label}</div>
    </motion.div>
  );
}
