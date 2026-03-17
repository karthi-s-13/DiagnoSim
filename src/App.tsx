import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Simulation from "./pages/Simulation";
import Result from "./pages/Result";
import KnowledgeLibrary from "./pages/KnowledgeLibrary";
import Performance from "./pages/Performance";
import Navbar from "./components/Navbar";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {user && <Navbar />}
        <main className={user ? "pt-16" : ""}>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/simulation/:caseId" element={user ? <Simulation /> : <Navigate to="/" />} />
            <Route path="/result/:attemptId" element={user ? <Result /> : <Navigate to="/" />} />
            <Route path="/library" element={user ? <KnowledgeLibrary /> : <Navigate to="/" />} />
            <Route path="/performance" element={user ? <Performance /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
