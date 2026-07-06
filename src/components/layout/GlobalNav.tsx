import { useAuth, type StaffRole } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, LogOut, Activity, Settings, Upload, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectionStatusIndicator } from "@/components/observability/ConnectionStatusIndicator";
import { PipelineActivityDrawer } from "@/components/observability/PipelineActivityFeed";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { Logo } from "@/components/ui/Logo";

const ROLE_STYLES: Record<StaffRole, { label: string; className: string }> = {
  attending: { label: "Attending", className: "bg-primary/20 text-primary border-primary/30" },
  nurse: { label: "Nurse", className: "bg-tier-watch/20 text-tier-watch border-tier-watch/30" },
  admin: { label: "Admin", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

import { motion } from "framer-motion";

export function GlobalNav() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleStyle = ROLE_STYLES[profile?.role ?? "nurse"];

  return (
    <div className="sticky top-0 left-0 right-0 z-50 pt-4 px-4 pb-4 pointer-events-none">
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="pointer-events-auto w-full max-w-7xl mx-auto rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4"
      >
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 group"
          >
            {/* 3D Animated CSS/SVG Logo Icon */}
            <Logo size={32} className="shrink-0" />
            {/* Typography */}
            <div className="flex flex-col justify-center text-left hidden md:flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="font-black text-sm leading-none tracking-tight text-slate-900">Sepsis</span>
              <span className="font-semibold text-[9px] leading-[1.2] text-blue-600 tracking-[0.2em] uppercase">Sentinel</span>
            </div>
          </button>

          <div className="h-4 w-px bg-slate-300 hidden sm:block" />

          <nav className="flex items-center gap-1">
            <NavTab to="/dashboard" active={location.pathname === "/dashboard"}>
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </NavTab>
          </nav>
        </div>

        {/* Removed Typewriter Text */}

        {/* Right: Status + Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden md:flex">
            <CommandMenu />
          </div>
          
          <div className="h-4 w-px bg-slate-300 hidden md:block" />

          {/* Bidirectional: Live connection indicator */}
          <ConnectionStatusIndicator />
          {/* Observability: Pipeline activity drawer */}
          <PipelineActivityDrawer />
          
          {location.pathname === "/" ? (
            <div className="flex items-center gap-3 ml-2 shrink-0">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs font-semibold rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 hidden sm:flex h-8 px-4"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button 
                size="sm"
                className="text-xs font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm h-8 px-5 font-sora"
                onClick={() => navigate("/register")}
              >
                Get Started
              </Button>
            </div>
          ) : (
            <>
              <Button 
                variant="outline"
                size="sm"
                className="hidden sm:flex text-xs font-semibold rounded-full bg-white/50 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-white hover:text-slate-900 h-8 px-4 ml-1 transition-all shadow-sm"
                onClick={() => navigate("/demo")}
              >
                <Play className="w-3 h-3 mr-1.5 fill-current" /> Demo
              </Button>
              
              <div className="hidden lg:flex items-center gap-3 ml-2">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-slate-900 leading-none">
                    {profile?.full_name || "Dr. Alex Demo"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {profile?.hospital_name || "Central Hospital"}
                  </span>
                </div>
                <Badge variant="outline" className={`text-[10px] px-2 py-0 border-0 ${roleStyle.className} rounded-full font-bold uppercase tracking-wider`}>
                  {roleStyle.label}
                </Badge>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors ml-1"
                onClick={async () => { await signOut(); navigate("/"); }}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </motion.header>
    </div>
  );
}

function NavTab({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${
        active
          ? "text-blue-700"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {active && (
        <motion.div 
          layoutId="activeTab" 
          className="absolute inset-0 bg-blue-50 border border-blue-100 rounded-full -z-10"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      {children}
    </button>
  );
}
