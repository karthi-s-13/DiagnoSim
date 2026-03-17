import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { Stethoscope, Activity, BookOpen, BarChart3, ShieldCheck } from "lucide-react";

export default function Landing() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: "student",
          unlockedLevel: 1,
          streak: 0,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative pt-20 pb-32 flex flex-col items-center px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-indigo-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-600 rounded-full blur-3xl"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl z-10"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-slate-900 mb-6">
            Diagno<span className="text-indigo-600">Sim</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The "LeetCode" for clinical medicine. Master diagnosis through AI-powered simulations, 
            track your daily streaks, and climb the curriculum leaderboard.
          </p>
          <button
            onClick={handleLogin}
            className="bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 mx-auto"
          >
            Get Started with Google
          </button>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto w-full px-4">
          <FeatureCard 
            icon={<Activity className="w-6 h-6 text-indigo-600" />}
            title="AI Virtual Patients"
            description="Realistic patient simulations with dynamic symptom progression and natural language interaction."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
            title="Clinical Accuracy"
            description="Built on medical logic and probabilistic models to ensure realistic lab results and vitals."
          />
          <FeatureCard 
            icon={<BookOpen className="w-6 h-6 text-amber-600" />}
            title="Knowledge Library"
            description="Access a comprehensive database of diseases, symptoms, and standard treatment protocols."
          />
          <FeatureCard 
            icon={<BarChart3 className="w-6 h-6 text-rose-600" />}
            title="Performance Insights"
            description="Detailed feedback on your diagnostic accuracy, speed, and clinical reasoning skills."
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          © 2026 DiagnoSim. For educational purposes only.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
    >
      <div className="mb-4 bg-slate-50 w-fit p-3 rounded-xl">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
