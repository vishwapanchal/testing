import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, Activity, Brain, Zap, Clock, ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useRef } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] aspect-square rounded-full bg-blue-100/40 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] aspect-square rounded-full bg-emerald-100/30 blur-[120px]" />
      </div>

      {/* Crisp Minimalist Hero Section - Split Layout */}
      <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-12 min-h-[calc(100vh-5rem)] flex flex-col items-center bg-slate-50 overflow-hidden" ref={containerRef}>
        <div className="absolute top-[10%] left-1/4 -translate-x-1/2 w-[80%] aspect-square rounded-full bg-blue-50/50 blur-[120px] pointer-events-none" />
        
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 mt-8 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column: Typography & CTAs */}
          <div className="flex-1 text-left flex flex-col items-start z-30">


            {/* Massive Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-slate-900 tracking-tight leading-[1.05] break-words"
              style={{ fontFamily: "'Overpass', sans-serif" }}
            >
              Precision Intelligence <br className="hidden lg:block"/> for <br className="lg:hidden"/>
              <span className="inline-flex items-center mt-2 relative">
                <span 
                  className="text-blue-600 pr-2 relative z-10 drop-shadow-sm font-normal"
                  style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.2em", lineHeight: "1.1" }}
                >
                  Modern ICUs.
                </span>
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg lg:text-xl text-slate-500 max-w-xl mt-8 font-normal leading-relaxed break-words"
            >
              Eradicate preventable deterioration. Our advanced ML pipeline detects sepsis up to <span className="font-semibold text-slate-800">4 hours before</span> traditional protocols.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <Button size="lg" className="w-full sm:w-auto rounded-full bg-slate-900 text-white hover:bg-slate-800 text-base px-8 py-7 shadow-xl shadow-slate-900/10 transition-all hover:scale-105 font-semibold" onClick={() => navigate(user ? "/dashboard" : "/login")}>
                {user ? "Enter Workspace" : "Deploy Sentinel"} <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full bg-white/50 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-white hover:text-slate-900 text-base px-8 py-7 transition-all shadow-sm font-semibold" onClick={() => navigate("/demo")}>
                View Architecture
              </Button>
            </motion.div>
          </div>
          
          {/* Right Column: 3D SVG Composition */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateY: 15 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="flex-1 relative w-full aspect-square max-w-[500px] lg:max-w-[700px] hidden md:flex items-center justify-center perspective-[1000px]"
          >
            {/* Decorative Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/40 to-indigo-300/30 rounded-full blur-[80px]" />
            
            {/* The 3D SVG Art */}
            <svg viewBox="0 0 400 400" className="w-full h-full relative z-10 drop-shadow-2xl overflow-visible">
              <defs>
                <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="node-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <g transform="translate(200, 200)">
                {/* Rotating Base Grid (Isometric projection simulated via scale & skew) */}
                <motion.g 
                  animate={{ rotateZ: 360 }} 
                  transition={{ duration: 60, ease: "linear", repeat: Infinity }}
                  style={{ transformOrigin: "0 0" }}
                >
                  <g transform="scale(1, 0.5) rotate(45)">
                    {[...Array(10)].map((_, i) => (
                      <rect key={`h-${i}`} x="-150" y={-150 + i * 30} width="300" height="1" fill="url(#grid-grad)" opacity="0.3" />
                    ))}
                    {[...Array(10)].map((_, i) => (
                      <rect key={`v-${i}`} x={-150 + i * 30} y="-150" width="1" height="300" fill="url(#grid-grad)" opacity="0.3" />
                    ))}
                  </g>
                </motion.g>

                {/* Floating Central Neural Core */}
                <motion.g
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                >
                  {/* Outer Ring */}
                  <motion.circle 
                    r="80" fill="none" stroke="url(#grid-grad)" strokeWidth="2" strokeDasharray="10 5 4 5"
                    animate={{ rotate: -360 }} transition={{ duration: 40, ease: "linear", repeat: Infinity }}
                  />
                  {/* Inner Ring */}
                  <motion.circle 
                    r="60" fill="none" stroke="url(#node-grad)" strokeWidth="1" strokeDasharray="40 10"
                    animate={{ rotate: 360 }} transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                  />
                  
                  {/* Central Node */}
                  <circle r="25" fill="url(#node-grad)" filter="url(#glow)" opacity="0.9" />
                  <circle r="15" fill="#ffffff" opacity="0.5" />
                  
                  {/* Orbiting Satellites */}
                  {[0, 120, 240].map((angle, index) => (
                    <motion.g
                      key={`sat-${index}`}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, ease: "linear", repeat: Infinity, delay: index * -5 }}
                    >
                      <g transform={`rotate(${angle})`}>
                        <motion.circle 
                          cx="90" cy="0" r="8" fill="url(#node-grad)" filter="url(#glow)"
                          animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity, delay: index }}
                        />
                        <line x1="25" y1="0" x2="90" y2="0" stroke="url(#grid-grad)" strokeWidth="1" strokeDasharray="4 4" />
                      </g>
                    </motion.g>
                  ))}
                  
                  {/* Floating geometric data blocks */}
                  <motion.path 
                    d="M-30,-50 L-10,-60 L10,-50 L-10,-40 Z" fill="url(#node-grad)" opacity="0.7"
                    animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }} transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                  />
                  <motion.path 
                    d="M40,30 L60,20 L80,30 L60,40 Z" fill="url(#grid-grad)" opacity="0.6"
                    animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }} transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, delay: 1 }}
                  />
                  <motion.path 
                    d="M-60,10 L-40,0 L-20,10 L-40,20 Z" fill="#60a5fa" opacity="0.8" filter="url(#glow)"
                    animate={{ y: [0, -25, 0], scale: [1, 1.2, 1] }} transition={{ duration: 7, ease: "easeInOut", repeat: Infinity, delay: 2 }}
                  />
                </motion.g>
              </g>
            </svg>
          </motion.div>
        </div>

        {/* Operational Metrics Line */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full mt-24 lg:mt-32 mb-10 relative z-10 px-6 flex justify-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 py-5 px-6 sm:px-10 w-full sm:w-auto rounded-2xl sm:rounded-full bg-white/60 border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 ring-1 ring-blue-100/50">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-2xl font-black text-slate-900 tracking-tight font-sora">240+</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active ICUs</span>
              </div>
            </div>
            
            <div className="hidden sm:block w-px h-12 bg-slate-200/80" />
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 ring-1 ring-emerald-100/50">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-2xl font-black text-slate-900 tracking-tight font-sora">1.2M+</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Lives Protected</span>
              </div>
            </div>

            <div className="hidden sm:block w-px h-12 bg-slate-200/80" />
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 ring-1 ring-indigo-100/50">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-2xl font-black text-slate-900 tracking-tight font-sora">99.9%</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Uptime SLA</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="relative z-10 py-32 px-6 bg-slate-50/50 border-t border-slate-100 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
            className="text-center max-w-2xl mx-auto mb-20 space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter font-sora break-words">Intelligence at every layer.</h2>
            <p className="text-slate-500 font-medium text-xl leading-relaxed break-words">Our 5-stage pipeline combines raw clinical data with quantum-inspired risk assessment to prevent critical deterioration.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 auto-rows-[350px]">
            {/* Large Bento Box: Deep Temporal Extraction */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.1, duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
              className="md:col-span-2 row-span-1 rounded-[2.5rem] bg-white border border-slate-200 overflow-hidden relative group shadow-xl shadow-slate-200/40"
            >
              {/* 3D SVG Background Element */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:scale-105 transition-transform duration-700">
                <svg viewBox="0 0 200 200" className="w-full h-full opacity-30">
                  <defs>
                    <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <motion.g animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "center" }}>
                    {[...Array(6)].map((_, i) => (
                      <motion.circle key={i} cx="100" cy="100" r={40 + i * 15} fill="none" stroke="url(#wave-grad)" strokeWidth="1" strokeDasharray={`${5 + i * 2} ${10 + i * 2}`} opacity={1 - (i * 0.15)} />
                    ))}
                  </motion.g>
                </svg>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent" />
              
              <div className="relative z-10 p-10 h-full flex flex-col justify-end">
                <div className="bg-white/80 backdrop-blur shadow-sm border border-slate-200 p-3 rounded-2xl w-14 h-14 flex items-center justify-center mb-6">
                  <Activity className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3 font-sora">Deep Temporal Extraction</h3>
                <p className="text-slate-600 text-lg max-w-lg leading-relaxed">Our LSTM architecture processes 15-minute intervals, capturing subtle patient trajectory shifts completely invisible to standard scoring systems.</p>
              </div>
            </motion.div>

            {/* Small Bento Box 1: Predictive ML */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.2, duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(79, 70, 229, 0.15)" }}
              className="md:col-span-1 row-span-1 rounded-[2.5rem] bg-indigo-600 border border-indigo-500 overflow-hidden relative group shadow-xl shadow-indigo-600/20 text-white"
            >
              {/* 3D SVG Grid element */}
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <pattern id="isometric" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="scale(2) rotate(45)">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#isometric)" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent mix-blend-multiply" />

              <div className="relative z-10 p-10 h-full flex flex-col justify-between">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl w-14 h-14 flex items-center justify-center">
                  <Zap className="h-7 w-7 text-indigo-100" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-sora">Predictive ML</h3>
                  <p className="text-indigo-100/80 text-base leading-relaxed">Neural circuits evaluate multi-dimensional risk instantly.</p>
                </div>
              </div>
            </motion.div>

            {/* Small Bento Box 2: Safety Tripwires */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.3, duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.15)" }}
              className="md:col-span-1 row-span-1 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 overflow-hidden relative group shadow-xl shadow-slate-200/40"
            >
              {/* 3D SVG Shield Element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full group-hover:scale-110 transition-transform duration-700">
                  <motion.path d="M50 10 L90 30 L90 60 C90 80 50 95 50 95 C50 95 10 80 10 60 L10 30 Z" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="5 5" animate={{ rotateY: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "center" }} />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />

              <div className="relative z-10 p-10 h-full flex flex-col justify-between">
                <div className="bg-emerald-100/80 backdrop-blur-sm border border-emerald-200 p-3 rounded-2xl w-14 h-14 flex items-center justify-center shadow-sm">
                  <Shield className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-emerald-950 mb-2 font-sora">Safety Tripwires</h3>
                  <p className="text-emerald-800/80 text-base leading-relaxed">Hardcoded clinical thresholds override ML models to prevent edge-case failures.</p>
                </div>
              </div>
            </motion.div>

            {/* Large Bento Box 2: Automated Orchestrator */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.4, duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
              className="md:col-span-2 row-span-1 rounded-[2.5rem] bg-white border border-slate-200 overflow-hidden relative group shadow-xl shadow-slate-200/40"
            >
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white opacity-80" />
               <div className="relative z-10 p-10 h-full flex flex-col justify-center">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center h-full">
                  <div className="md:col-span-3 h-full flex flex-col justify-between">
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl w-14 h-14 shadow-sm flex items-center justify-center mb-6">
                      <Clock className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-slate-900 mb-3 font-sora">Automated Orchestrator</h3>
                      <p className="text-slate-600 text-lg leading-relaxed max-w-sm">Translates complex AI scoring into immediate clinical action paths: Watch, Amber, or Critical protocols.</p>
                    </div>
                  </div>
                  
                  {/* Floating Action Cards */}
                  <div className="md:col-span-2 flex flex-col gap-4 relative">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-4 bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-lg shadow-slate-200/50">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">Reduced false positives</span>
                    </motion.div>
                    
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="flex items-center gap-4 bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-lg shadow-slate-200/50 -ml-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">15-minute reporting cycle</span>
                    </motion.div>
                    
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="flex items-center gap-4 bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-lg shadow-slate-200/50">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">EMR Integration Ready</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 overflow-hidden bg-slate-50 border-t border-slate-100">
        <div className="absolute inset-0 bg-blue-50/50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-12 border border-slate-100 ring-1 ring-slate-100"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Empower your clinical staff today.</h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Join leading intensive care units using Sepsis Sentinel to reduce mortality rates and optimize workflows.
            </p>
            <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 h-auto text-base shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform font-semibold" onClick={() => navigate(user ? "/dashboard" : "/login")}>
              {user ? "Open Workspace" : "Begin Free Trial"} <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-slate-900">Sepsis Sentinel</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Sepsis Sentinel. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">HIPAA Compliant</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">ISO 27001</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
