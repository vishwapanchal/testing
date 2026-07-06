import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Activity, Brain, Zap, Clock, ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useRef, useState, useEffect, useMemo } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 50], [0, -10]);
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.9]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Typewriter effect
  const words = useMemo(() => ["Modern ICUs.", "Critical Care.", "Rapid Response.", "Healthcare."], []);
  const [currentWord, setCurrentWord] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % words.length;
      const fullText = words[i];

      setCurrentWord(
        isDeleting
          ? fullText.substring(0, currentWord.length - 1)
          : fullText.substring(0, currentWord.length + 1)
      );

      setTypingSpeed(isDeleting ? 40 : 120);

      if (!isDeleting && currentWord === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && currentWord === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentWord, isDeleting, loopNum, typingSpeed, words]);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] aspect-square rounded-full bg-blue-100/40 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] aspect-square rounded-full bg-emerald-100/30 blur-[120px]" />
      </div>

      {/* Floating Header */}
      <motion.nav 
        style={{ y: headerY, opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 pt-4 pb-2"
      >
        <div className="max-w-6xl mx-auto rounded-full bg-white/80 border border-slate-200/60 backdrop-blur-xl shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <Logo size={28} />
            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="font-extrabold text-base tracking-tight text-slate-800 hidden sm:block ml-2">
              SEPSIS<span className="text-blue-600">SENTINEL</span>
            </span>
          </div>

          {/* Middle Typing Animation */}
          <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 text-sm font-medium text-slate-600">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic font-serif pr-1 relative z-10 drop-shadow-sm font-semibold">{currentWord}</span>
            <span className="w-0.5 h-4 bg-blue-500 animate-pulse rounded-full"></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="rounded-full text-slate-600 hover:bg-slate-100 hidden sm:flex font-semibold" onClick={() => navigate("/login")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/register")} className="rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all font-semibold px-5">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Crisp Minimalist Hero Section - Split Layout */}
      <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-12 min-h-[calc(100vh-5rem)] flex flex-col items-center bg-slate-50 overflow-hidden" ref={containerRef}>
        <div className="absolute top-[10%] left-1/4 -translate-x-1/2 w-[80%] aspect-square rounded-full bg-blue-50/50 blur-[120px] pointer-events-none" />
        
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 mt-8 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column: Typography & CTAs */}
          <div className="flex-1 text-left flex flex-col items-start z-30">


            {/* Massive Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-slate-800 tracking-tight leading-[1.05] break-words"
              style={{ fontFamily: "'Overpass', sans-serif" }}
            >
              Precision Intelligence <br className="hidden lg:block"/> <span className="text-slate-400 font-extralight italic">for</span> <br className="lg:hidden"/>
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
              className="text-lg lg:text-xl text-slate-500 max-w-xl mt-8 font-normal leading-relaxed"
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
            
            {/* The Vascular AI Scanner Graphic */}
            <svg viewBox="0 0 600 600" className="w-full h-full relative z-10 drop-shadow-2xl overflow-visible font-sans">
              <defs>
                {/* Gradients */}
                <linearGradient id="vessel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="threat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="scan-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>

                {/* Filters */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="heavy-glow">
                  <feGaussianBlur stdDeviation="12" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <g transform="translate(300, 300)">
                {/* Ambient Grid Scanner */}
                <motion.g 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 40, ease: "linear", repeat: Infinity }}
                  opacity="0.15"
                >
                  <circle cx="0" cy="0" r="220" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 12" />
                  <circle cx="0" cy="0" r="160" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 6" />
                  <line x1="-240" y1="0" x2="240" y2="0" stroke="#334155" strokeWidth="1" />
                  <line x1="0" y1="-240" x2="0" y2="240" stroke="#334155" strokeWidth="1" />
                </motion.g>

                {/* The Vascular / Neural Structure */}
                <g filter="url(#glow)">
                  <path d="M 0,180 C 0,100 -60,60 -80,0 C -100,-60 -40,-100 -20,-160" fill="none" stroke="url(#vessel-grad)" strokeWidth="6" strokeLinecap="round" />
                  <path d="M -80,0 C -120,-20 -160,20 -200,-20" fill="none" stroke="url(#vessel-grad)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 0,180 C 40,120 100,100 80,20 C 60,-60 120,-100 140,-160" fill="none" stroke="url(#vessel-grad)" strokeWidth="7" strokeLinecap="round" />
                  <path d="M 80,20 C 140,0 160,60 220,40" fill="none" stroke="url(#vessel-grad)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 80,20 C 100,-20 60,-40 80,-80" fill="none" stroke="url(#vessel-grad)" strokeWidth="3" strokeLinecap="round" />
                </g>

                {/* Healthy Nodes */}
                {[
                  [-20, -160], [140, -160], [-200, -20], [220, 40], [80, -80], [0, 180]
                ].map((pos, i) => (
                  <circle key={i} cx={pos[0]} cy={pos[1]} r="6" fill="#3b82f6" filter="url(#glow)" />
                ))}

                {/* Sepsis Threat Nodes */}
                <motion.circle 
                  cx="-80" cy="0" r="10" fill="url(#threat-grad)" filter="url(#heavy-glow)"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.circle 
                  cx="80" cy="20" r="14" fill="url(#threat-grad)" filter="url(#heavy-glow)"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />

                {/* Scanning Laser */}
                <motion.g
                  animate={{ y: [-200, 200, -200] }}
                  transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                >
                  <rect x="-250" y="-10" width="500" height="20" fill="url(#scan-grad)" />
                  <line x1="-250" y1="0" x2="250" y2="0" stroke="#10b981" strokeWidth="2" filter="url(#glow)" />
                </motion.g>

                {/* AI Targeting Reticles & Tooltips (Appears over Sepsis Nodes) */}
                <motion.g 
                  animate={{ opacity: [0.2, 1, 0.2] }} 
                  transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, delay: 0.5 }}
                >
                  {/* Target 1 */}
                  <g transform="translate(-80, 0)">
                    <path d="M -25,-15 L -25,-25 L -15,-25 M 15,-25 L 25,-25 L 25,-15 M 25,15 L 25,25 L 15,25 M -15,25 L -25,25 L -25,15" fill="none" stroke="#ef4444" strokeWidth="2" />
                    <line x1="25" y1="-25" x2="60" y2="-50" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
                    <rect x="60" y="-70" width="120" height="40" rx="4" fill="#ffffff" stroke="#ef4444" strokeWidth="1" filter="url(#glow)" />
                    <text x="70" y="-55" fill="#ef4444" fontSize="10" fontWeight="bold" letterSpacing="1">BIOMARKER 4A</text>
                    <text x="70" y="-40" fill="#0f172a" fontSize="14" fontWeight="800">SEPSIS DETECTED</text>
                  </g>
                  
                  {/* Target 2 */}
                  <g transform="translate(80, 20)">
                    <path d="M -30,-20 L -30,-30 L -20,-30 M 20,-30 L 30,-30 L 30,-20 M 30,20 L 30,30 L 20,30 M -20,30 L -30,30 L -30,20" fill="none" stroke="#f97316" strokeWidth="2" />
                    <line x1="-30" y1="30" x2="-60" y2="70" stroke="#f97316" strokeWidth="1" strokeDasharray="2 2" />
                    <rect x="-170" y="70" width="110" height="40" rx="4" fill="#ffffff" stroke="#f97316" strokeWidth="1" filter="url(#glow)" />
                    <text x="-160" y="85" fill="#f97316" fontSize="10" fontWeight="bold" letterSpacing="1">LACTATE SPIKE</text>
                    <text x="-160" y="100" fill="#0f172a" fontSize="14" fontWeight="800">RISK: 94%</text>
                  </g>
                </motion.g>

                {/* Floating "AI Sentinel" Orbitals */}
                <motion.g animate={{ rotate: -360 }} transition={{ duration: 20, ease: "linear", repeat: Infinity }}>
                  <circle cx="200" cy="0" r="5" fill="#10b981" filter="url(#heavy-glow)" />
                  <path d="M 190,0 A 200 200 0 0 1 210,0" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                </motion.g>
                <motion.g animate={{ rotate: 360 }} transition={{ duration: 30, ease: "linear", repeat: Infinity }}>
                  <circle cx="-160" cy="0" r="4" fill="#3b82f6" filter="url(#glow)" />
                  <path d="M -150,0 A 160 160 0 0 1 -170,0" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
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
