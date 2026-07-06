import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Activity, Brain, Zap, Clock, ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";
import { useRef } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 50], [0, -10]);
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.9]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/40 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-emerald-100/30 blur-[120px]" />
      </div>

      {/* Floating Header */}
      <motion.nav 
        style={{ y: headerY, opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 pt-4 pb-2"
      >
        <div className="max-w-6xl mx-auto rounded-full bg-white/70 border border-slate-200/50 backdrop-blur-md shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg shadow-md shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-800 hidden sm:block">
              QUANTUM<span className="text-blue-600">HEALTH</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors hidden sm:block">Technology</a>
            {user ? (
              <Button onClick={() => navigate("/dashboard")} className="rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10">
                Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="rounded-full text-slate-600 hover:bg-slate-100 hidden sm:flex" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/login")} className="rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all">
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6 lg:pt-48 lg:pb-32 min-h-[90vh] flex flex-col justify-center" ref={containerRef}>
        <div className="max-w-5xl mx-auto text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full bg-white border border-slate-200 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Next-Gen Sepsis Detection</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1.05]"
          >
            Detect Sepsis <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500">
              Before It Strikes.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            A real-time early warning system engineered for modern ICUs.
            Anticipate clinical deterioration up to <strong className="text-slate-900 font-bold">4 hours</strong> earlier using quantum-inspired temporal ML.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="rounded-full bg-slate-900 text-white hover:bg-slate-800 text-base px-8 py-6 h-auto shadow-xl shadow-slate-900/10 w-full sm:w-auto transition-transform hover:scale-105 active:scale-95" onClick={() => navigate(user ? "/dashboard" : "/login")}>
              {user ? "Enter Workspace" : "Request Access"} <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full bg-white text-slate-700 border-slate-200 hover:bg-slate-50 text-base px-8 py-6 h-auto w-full sm:w-auto transition-transform hover:scale-105 active:scale-95" onClick={() => navigate("/demo")}>
              <Activity className="h-5 w-5 mr-2 text-blue-600" /> Interactive Demo
            </Button>
          </motion.div>
        </div>

        {/* Dashboard Mockup / Floating Graphic */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 max-w-5xl mx-auto relative perspective-1000"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10 top-1/2 rounded-b-3xl pointer-events-none" />
          <div className="bg-white p-2 rounded-2xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl transform rotate-x-[5deg] hover:rotate-x-0 transition-transform duration-700">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden relative">
               <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-white">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Mock UI elements */}
                 <div className="space-y-4">
                    <div className="h-4 w-24 bg-slate-200 rounded-full" />
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-blue-500 rounded-full" />
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-emerald-400 rounded-full" />
                    </div>
                 </div>
                 <div className="col-span-2 space-y-3">
                    <div className="flex gap-4">
                      <div className="h-20 w-1/3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-center justify-center p-4">
                        <div className="w-full">
                          <div className="h-3 w-12 bg-slate-200 rounded-full mb-3" />
                          <div className="h-6 w-16 bg-slate-800 rounded-full" />
                        </div>
                      </div>
                      <div className="h-20 w-1/3 bg-blue-50 border border-blue-100 rounded-lg shadow-sm flex items-center justify-center p-4">
                        <div className="w-full">
                          <div className="h-3 w-12 bg-blue-200 rounded-full mb-3" />
                          <div className="h-6 w-16 bg-blue-600 rounded-full" />
                        </div>
                      </div>
                      <div className="h-20 w-1/3 bg-red-50 border border-red-100 rounded-lg shadow-sm flex items-center justify-center p-4 relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-red-100/50" />
                        <div className="w-full relative z-10">
                          <div className="h-3 w-12 bg-red-200 rounded-full mb-3" />
                          <div className="h-6 w-16 bg-red-600 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="h-32 w-full bg-white border border-slate-100 rounded-lg shadow-sm p-4 relative overflow-hidden">
                      {/* Fake sine wave */}
                      <svg viewBox="0 0 100 20" className="w-full h-full absolute inset-0 opacity-20" preserveAspectRatio="none">
                        <path d="M0,10 Q10,0 20,10 T40,10 T60,10 T80,10 T100,10" fill="none" stroke="#2563eb" strokeWidth="2" />
                        <path d="M0,15 Q10,5 20,15 T40,15 T60,15 T80,15 T100,15" fill="none" stroke="#10b981" strokeWidth="1" />
                      </svg>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="relative z-10 py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center max-w-2xl mx-auto mb-16 space-y-4"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Intelligence at every layer.</h2>
            <p className="text-slate-500 font-medium text-lg">Our 5-stage pipeline combines raw clinical data with quantum-inspired risk assessment to prevent critical deterioration.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Large Bento Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="md:col-span-2 row-span-1 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-8 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                <Brain className="w-full h-full text-blue-600" />
              </div>
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <div className="bg-white/80 backdrop-blur shadow-sm border border-slate-200 p-2 rounded-xl w-12 h-12 flex items-center justify-center mb-6">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Deep Temporal Extraction</h3>
                <p className="text-slate-600 max-w-md">Our LSTM architecture processes 15-minute intervals, capturing subtle patient trajectory shifts completely invisible to standard scoring systems.</p>
              </div>
            </motion.div>

            {/* Small Bento Box 1 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="md:col-span-1 row-span-1 rounded-3xl bg-indigo-50 border border-indigo-100 overflow-hidden relative group"
            >
              <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                <div className="bg-white p-2 rounded-xl w-12 h-12 shadow-sm flex items-center justify-center">
                  <Zap className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Quantum Scoring</h3>
                  <p className="text-indigo-700 text-sm">Variational quantum circuits evaluate multi-dimensional risk instantly.</p>
                </div>
              </div>
            </motion.div>

            {/* Small Bento Box 2 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="md:col-span-1 row-span-1 rounded-3xl bg-emerald-50 border border-emerald-100 overflow-hidden relative group"
            >
              <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                <div className="bg-white p-2 rounded-xl w-12 h-12 shadow-sm flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">Safety Tripwires</h3>
                  <p className="text-emerald-700 text-sm">Hardcoded clinical thresholds override ML models to prevent edge-case failures.</p>
                </div>
              </div>
            </motion.div>

            {/* Large Bento Box 2 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="md:col-span-2 row-span-1 rounded-3xl bg-slate-900 text-white overflow-hidden relative group"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-blue-900" />
               <div className="relative z-10 p-8 h-full flex flex-col justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <div className="bg-white/10 p-2 rounded-xl w-12 h-12 flex items-center justify-center mb-6">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Automated Orchestrator</h3>
                    <p className="text-slate-300">Translates complex AI scoring into immediate clinical action paths: Watch, Amber, or Critical protocols.</p>
                  </div>
                  <div className="flex flex-col justify-center space-y-3">
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-medium">Reduced false positives</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-medium">15-minute reporting cycle</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-medium">EMR Integration Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-blue-600/5 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-12 border border-slate-100"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Empower your clinical staff today.</h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Join leading intensive care units using QuantumHealth to reduce mortality rates and optimize workflows.
            </p>
            <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 h-auto text-base shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform" onClick={() => navigate(user ? "/dashboard" : "/login")}>
              {user ? "Open Workspace" : "Begin Free Trial"} <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900">QuantumHealth</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} QuantumHealth AI Systems. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">HIPAA Compliant</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">ISO 27001</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
