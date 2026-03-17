import { Link, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { Stethoscope, LayoutDashboard, BookOpen, BarChart3, LogOut } from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: "/library", label: "Library", icon: <BookOpen className="w-4 h-4" /> },
    { path: "/performance", label: "Performance", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">DiagnoSim</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                location.pathname === item.path
                  ? "bg-slate-100 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
          <img 
            src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName}`} 
            alt="Profile" 
            className="w-6 h-6 rounded-full"
          />
          <span className="text-xs font-semibold text-slate-700">{auth.currentUser?.displayName}</span>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
