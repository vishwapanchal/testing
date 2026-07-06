import { useState, useEffect, useCallback, useRef } from "react";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  predict, SCENARIOS,
  type VitalInputs, type PredictionResult, type AlertLevel,
} from "@/lib/demoEngine";
import {
  Shield, Activity, AlertTriangle, Heart, Thermometer,
  Wind, Droplets, Brain, Zap, Play, Pause, RotateCcw,
  Timer, Clock, ChevronRight, Upload, User, Stethoscope,
  MousePointer, Check
} from "lucide-react";

/* ── helpers ───────────────────────────────────────────────── */
const TIER_COLORS: Record<AlertLevel, string> = {
  WATCH: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AMBER: "bg-amber-100 text-amber-800 border-amber-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
  "FAST-TRACK": "bg-purple-100 text-purple-800 border-purple-200",
};
const TIER_BG: Record<AlertLevel, string> = {
  WATCH: "border-emerald-200 bg-emerald-50",
  AMBER: "border-amber-200 bg-amber-50",
  CRITICAL: "border-red-200 bg-red-50 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
  "FAST-TRACK": "border-purple-200 bg-purple-50",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  LOW: "bg-blue-500",
  HIGH: "bg-red-500",
  NORMAL: "bg-emerald-500",
};

function vitalStatus(val: number, lo: number, hi: number) {
  if (val < lo) return { label: "LOW", cls: "text-blue-600 font-semibold" };
  if (val > hi) return { label: "HIGH", cls: "text-red-600 font-semibold" };
  return { label: "NORMAL", cls: "text-emerald-600 font-medium" };
}

type DemoMode = "instant" | "manual" | "simulated";

/* ── motion variants ───────────────────────────────────────── */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};
const bentoItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

/* ── premium card wrapper ──────────────────────────────────── */
function PremiumCard({ children, className, noBorderLeft, ...props }: React.ComponentProps<typeof Card> & { noBorderLeft?: boolean }) {
  return (
    <motion.div
      variants={bentoItem}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 400 } }}
    >
      <Card 
        className={cn(
          "bg-white border border-slate-200/80 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/40",
          !noBorderLeft && "border-l-4 border-l-blue-500/30",
          className
        )} 
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
}

/* ── main page ─────────────────────────────────────────────── */
export default function DemoSimulator() {
  const [scenario, setScenario] = useState("normal");
  const [vitals, setVitals] = useState<VitalInputs>({ ...SCENARIOS.normal.vitals });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [mode, setMode] = useState<DemoMode>("instant");
  const [history, setHistory] = useState<{ time: string; risk: number; confidence: number }[]>([]);
  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Phase 2: CXR upload state
  const [cxrFile, setCxrFile] = useState<File | null>(null);
  const [cxrPreview, setCxrPreview] = useState<string | null>(null);

  /* run prediction — always client-side for guaranteed field shape */
  const runPrediction = useCallback(() => {
    setIsLoading(true);
    const r = predict(vitals);
    setResult(r);
    setHistory((h) => {
      const last = h[h.length - 1];
      if (last && last.risk === r.risk_score && h.length > 0) return h;
      return [
        ...h.slice(-50),
        { time: new Date().toLocaleTimeString(), risk: r.risk_score, confidence: r.confidence },
      ];
    });
    setIsLoading(false);
  }, [vitals]);

  /* instant mode: auto-predict on vitals change with debounce */
  useEffect(() => {
    if (mode !== "instant") return;
    const t = setTimeout(() => {
      runPrediction();
    }, 300); // 300ms debounce
    return () => clearTimeout(t);
  }, [vitals, mode, runPrediction]);

  /* scenario change */
  useEffect(() => {
    const s = SCENARIOS[scenario];
    if (s) {
      setVitals({ ...s.vitals });
      setHistory([]);
      setSimStep(0);
      setSimRunning(false);
    }
  }, [scenario]);

  /* simulated 15-min cycle */
  useEffect(() => {
    if (simRunning && mode === "simulated") {
      intervalRef.current = setInterval(() => {
        setSimStep((s) => s + 1);
        runPrediction();
      }, 3000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [simRunning, mode, runPrediction]);

  const updateVital = (key: keyof VitalInputs, val: number) => {
    setVitals((prev) => ({ ...prev, [key]: val }));
  };

  /* ── SVG gauge ──────────────────────────────────────────── */
  const gaugeRadius = 50;
  const gaugeCirc = Math.PI * gaugeRadius;
  const gaugeOffset = result ? gaugeCirc - (result.risk_score * gaugeCirc) : gaugeCirc;
  const gaugeColor = !result ? "#e2e8f0" :
    result.alert_level === "CRITICAL" ? "#ef4444" :
    result.alert_level === "AMBER" ? "#f59e0b" : "#10b981";
  const isCritical = result?.alert_level === "CRITICAL";

  return (
    <div
      className="min-h-screen text-slate-900 selection:bg-blue-100 font-sans"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <GlobalNav />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-6 py-4 shadow-sm z-10 relative">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/25">
              <Shield className="h-5 w-5" />
            </div>
            <h1
              className="text-lg font-bold text-slate-900 tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Demo Simulator
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono bg-slate-100 text-slate-600 border-slate-200 ml-2 shadow-sm">
              {result ? (result.backend === "client_fallback" ? "fallback" : result.backend) : "ensemble"}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono bg-blue-50 text-blue-700 border-blue-200 shadow-sm flex items-center gap-1.5">
              {mode === "instant" ? <><Zap className="h-3 w-3" /> Instant</> : mode === "manual" ? <><MousePointer className="h-3 w-3" /> Manual</> : <><Timer className="h-3 w-3" /> 15-min Cycle</>}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {/* Mode selector */}
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200 shadow-inner">
              <Label className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 pl-2">Mode</Label>
              <Select value={mode} onValueChange={(v) => { setMode(v as DemoMode); setSimRunning(false); }}>
                <SelectTrigger className="w-[170px] h-8 text-xs bg-white border-slate-200 shadow-sm font-medium rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-slate-200">
                  <SelectItem value="instant" className="text-xs focus:bg-slate-50">
                    <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> Demo Instant</span>
                  </SelectItem>
                  <SelectItem value="manual" className="text-xs focus:bg-slate-50">
                    <span className="flex items-center gap-1.5"><MousePointer className="h-3 w-3" /> Manual (click)</span>
                  </SelectItem>
                  <SelectItem value="simulated" className="text-xs focus:bg-slate-50">
                    <span className="flex items-center gap-1.5"><Timer className="h-3 w-3" /> 15-min Cycle</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
        >
          {/* ── LEFT: Controls ─────────────────────────── */}
          <motion.div variants={fadeInUp} className="lg:col-span-3 space-y-5">
            {/* Scenario */}
            <PremiumCard className="border-l-indigo-500/40">
              <CardHeader className="pb-3 border-b border-slate-100 bg-indigo-50/30">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Patient Scenario
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Select value={scenario} onValueChange={setScenario}>
                  <SelectTrigger className="h-10 text-sm font-medium bg-white border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-slate-200">
                    {Object.entries(SCENARIOS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-sm cursor-pointer focus:bg-slate-50 py-2">
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {SCENARIOS[scenario]?.description}
                </p>
              </CardContent>
            </PremiumCard>

            {/* Phase 2: Demographics */}
            <PremiumCard className="border-l-sky-500/40">
              <CardHeader className="pb-3 border-b border-slate-100 bg-sky-50/30">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-blue-500" /> Patient Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <VitalSlider icon={<User className="h-3.5 w-3.5 text-slate-400" />} label="Age" unit="yrs" value={vitals.age} min={18} max={100} step={1} onChange={(v) => updateVital("age", v)} />
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                    <User className="h-3.5 w-3.5" /> Gender
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={vitals.gender === "M" ? "default" : "outline"}
                      onClick={() => setVitals(prev => ({ ...prev, gender: "M" as const }))}
                      className={cn("text-xs px-5 h-8 rounded-full font-medium transition-all", vitals.gender === "M" ? "bg-slate-900 hover:bg-slate-800 shadow-md" : "border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm")}
                    >Male</Button>
                    <Button 
                      size="sm" 
                      variant={vitals.gender === "F" ? "default" : "outline"}
                      onClick={() => setVitals(prev => ({ ...prev, gender: "F" as const }))}
                      className={cn("text-xs px-5 h-8 rounded-full font-medium transition-all", vitals.gender === "F" ? "bg-slate-900 hover:bg-slate-800 shadow-md" : "border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm")}
                    >Female</Button>
                  </div>
                </div>
              </CardContent>
            </PremiumCard>

            {/* Phase 2: CXR Upload */}
            <PremiumCard className="border-l-violet-500/40">
              <CardHeader className="pb-3 border-b border-slate-100 bg-violet-50/30">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5 text-indigo-500" /> Chest X-Ray
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  id="cxr-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCxrFile(file);
                      setCxrPreview(URL.createObjectURL(file));
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = (reader.result as string).split(",")[1];
                        setVitals(prev => ({ ...prev, cxr_image_base64: base64 }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs h-9 rounded-xl border-dashed border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all font-medium shadow-sm"
                  onClick={() => document.getElementById("cxr-upload")?.click()}
                >
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  {cxrFile ? "Change X-Ray" : "Upload CXR Image"}
                </Button>
                
                <AnimatePresence>
                  {cxrFile && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <p className="text-[11px] text-emerald-600 font-mono font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {cxrFile.name}
                      </p>
                      {cxrPreview && (
                        <div className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200">
                          <img src={cxrPreview} alt="CXR Preview" className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                            <Button size="sm" variant="destructive" className="h-7 text-xs rounded-full shadow-lg"
                              onClick={() => {
                                setCxrFile(null);
                                setCxrPreview(null);
                                setVitals(prev => { const { cxr_image_base64, ...rest } = prev; return { ...rest } as typeof prev; });
                              }}
                            >Remove</Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {!cxrFile && (
                  <p className="text-[11px] text-slate-500 font-medium text-center px-2 leading-relaxed">Upload a chest X-ray JPEG for AI-powered pulmonary analysis</p>
                )}
              </CardContent>
            </PremiumCard>

            {/* Vital Sliders */}
            <PremiumCard className="border-l-rose-500/40">
              <CardHeader className="pb-3 border-b border-slate-100 bg-rose-50/20">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-rose-500" /> Vital Signs Input
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-6">
                <VitalSlider icon={<Heart className="h-4 w-4 text-rose-500" />} label="Heart Rate" unit="bpm" value={vitals.heart_rate} min={30} max={200} step={1} onChange={(v) => updateVital("heart_rate", v)} />
                <VitalSlider icon={<Droplets className="h-4 w-4 text-blue-500" />} label="MAP" unit="mmHg" value={vitals.map} min={30} max={140} step={1} onChange={(v) => updateVital("map", v)} />
                <VitalSlider icon={<Thermometer className="h-4 w-4 text-orange-500" />} label="Temperature" unit="°C" value={vitals.temperature} min={33} max={42} step={0.1} onChange={(v) => updateVital("temperature", v)} />
                <VitalSlider icon={<Wind className="h-4 w-4 text-cyan-500" />} label="Resp Rate" unit="br/min" value={vitals.resp_rate} min={5} max={45} step={1} onChange={(v) => updateVital("resp_rate", v)} />
                <VitalSlider icon={<Droplets className="h-4 w-4 text-blue-400" />} label="SpO2" unit="%" value={vitals.spo2} min={70} max={100} step={1} onChange={(v) => updateVital("spo2", v)} />
                <VitalSlider icon={<Brain className="h-4 w-4 text-purple-500" />} label="GCS" unit="" value={vitals.gcs_total} min={3} max={15} step={1} onChange={(v) => updateVital("gcs_total", v)} />
                <VitalSlider icon={<Zap className="h-4 w-4 text-amber-500" />} label="Lactate" unit="mmol/L" value={vitals.lactate} min={0.5} max={15} step={0.1} onChange={(v) => updateVital("lactate", v)} />
                <VitalSlider icon={<Activity className="h-4 w-4 text-slate-400" />} label="WBC" unit="K/uL" value={vitals.wbc} min={0.5} max={40} step={0.5} onChange={(v) => updateVital("wbc", v)} />
                <VitalSlider icon={<Activity className="h-4 w-4 text-slate-400" />} label="Creatinine" unit="mg/dL" value={vitals.creatinine} min={0.3} max={8} step={0.1} onChange={(v) => updateVital("creatinine", v)} />
                <VitalSlider icon={<Activity className="h-4 w-4 text-slate-400" />} label="Platelets" unit="K/uL" value={vitals.platelets} min={10} max={400} step={5} onChange={(v) => updateVital("platelets", v)} />
              </CardContent>
            </PremiumCard>

            {/* Action buttons */}
            <AnimatePresence mode="wait">
              {mode === "manual" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Button 
                    className="w-full h-12 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-900/20 transition-all text-white" 
                    onClick={runPrediction} 
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="animate-pulse flex items-center gap-2"><Activity className="h-4 w-4 animate-spin" /> Analyzing...</span> : <><Play className="h-4 w-4 mr-2" /> Run Prediction</>}
                  </Button>
                </motion.div>
              )}
              {mode === "simulated" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                  <div className="flex gap-2">
                    <Button 
                      className={cn("flex-1 h-10 text-xs font-semibold rounded-xl shadow-md transition-all", simRunning ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-900/20 text-white")} 
                      onClick={() => setSimRunning(!simRunning)}
                    >
                      {simRunning ? <><Pause className="h-4 w-4 mr-1.5" /> Pause</> : <><Play className="h-4 w-4 mr-1.5" /> Start</>}
                    </Button>
                    <Button variant="outline" className="h-10 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm" onClick={() => { runPrediction(); setSimStep((s) => s + 1); }}>
                      <ChevronRight className="h-4 w-4" /> Step
                    </Button>
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm" onClick={() => { setSimStep(0); setHistory([]); setSimRunning(false); }}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[11px] font-mono font-medium text-slate-500 bg-slate-100/80 py-2 rounded-lg border border-slate-200/60">
                    <Timer className="h-3.5 w-3.5 text-slate-400" />
                    Step {simStep} · <span className="text-slate-700 font-bold tabular-nums">{simStep * 15} min elapsed</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── CENTER: Results (Bento Grid) ─────────────────────────── */}
          <motion.div variants={fadeInUp} className="lg:col-span-6 space-y-5">
            {/* Alert Banner */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={
                    isCritical
                      ? { opacity: 1, scale: [1, 1.01, 1], transition: { scale: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } } }
                      : { opacity: 1, scale: 1 }
                  }
                  className={cn(
                    "rounded-2xl p-5 text-center shadow-lg transition-all overflow-hidden relative",
                    result.alert_level === "CRITICAL"
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-400/30"
                      : result.alert_level === "AMBER"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-400/30"
                      : result.alert_level === "FAST-TRACK"
                      ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white border border-purple-400/30"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border border-emerald-400/30"
                  )}
                >
                  <p className="text-lg sm:text-xl font-bold tracking-tight">
                    STATUS: <span className="font-mono uppercase px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-sm shadow-sm ml-1">{result.alert_level}</span>
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <span className="text-sm font-semibold bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm tabular-nums font-mono">
                      Risk: {(result.risk_score * 100).toFixed(1)}%
                    </span>
                    <span className="text-sm font-semibold bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm tabular-nums font-mono">
                      Confidence: {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {result.fast_tracked && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-bold mt-4 bg-white/20 backdrop-blur-sm inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full shadow-sm"
                    >
                      <Zap className="h-3 w-3" /> FAST-TRACKED (Low Model Confidence)
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bento Grid */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-5"
            >
              {/* Risk Gauge — full width hero card */}
              <PremiumCard className={cn("col-span-2 border-l-indigo-500/50", isCritical && "shadow-[0_0_30px_rgba(239,68,68,0.25)]")} noBorderLeft>
                <CardHeader className="pb-1 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 text-center">
                    Risk Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-6 pb-4">
                  <div className={cn("relative w-48 h-28", isCritical && "drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
                    <svg viewBox="0 0 110 60" className="w-full h-full">
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                        {isCritical && (
                          <filter id="gaugeGlow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        )}
                      </defs>
                      <path d="M 5 55 A 50 50 0 0 1 105 55" fill="none" stroke="#f1f5f9" strokeWidth="9" strokeLinecap="round" />
                      <path
                        d="M 5 55 A 50 50 0 0 1 105 55"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={`${gaugeCirc}`}
                        strokeDashoffset={gaugeOffset}
                        filter={isCritical ? "url(#gaugeGlow)" : undefined}
                        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                      <span
                        className="text-4xl font-black tracking-tighter tabular-nums font-mono"
                        style={{ color: gaugeColor !== "#e2e8f0" ? gaugeColor : "#94a3b8" }}
                      >
                        {result ? (result.risk_score * 100).toFixed(1) : "\u2014"}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-4 tracking-wide">0% (Safe) \u2014 100% (Septic)</p>
                </CardContent>
              </PremiumCard>

              {/* Decision Summary — spans 1 col, taller */}
              <PremiumCard className="row-span-2 border-l-amber-500/40">
                <CardHeader className="pb-2 border-b border-slate-100 bg-amber-50/30">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Model Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-2.5 text-xs font-medium">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Alert Level</span>
                    <Badge className={cn("text-[9px] font-bold uppercase px-1.5 py-0", result ? TIER_COLORS[result.alert_level] : "bg-slate-100 text-slate-400")}>{result?.alert_level ?? "\u2014"}</Badge>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                    <span className="text-slate-500">Tripwires</span>
                    <span className="font-mono font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 tabular-nums">{result?.n_active_tripwires ?? 0} / 7</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                    <span className="text-slate-500">LSTM</span>
                    <span className="font-mono text-slate-700 font-semibold tabular-nums">{result?.lstm_score?.toFixed(3) ?? "\u2014"}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                    <span className="text-slate-500">XGBoost</span>
                    <span className="font-mono text-slate-700 font-semibold tabular-nums">{result?.xgb_score?.toFixed(3) ?? "\u2014"}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                    <span className="text-slate-500">Conformal</span>
                    <span className="font-mono text-[9px] text-slate-600 bg-slate-50 px-1 py-0.5 rounded font-semibold tabular-nums">[{result?.conformal_interval?.[0]?.toFixed(2) ?? "-"}, {result?.conformal_interval?.[1]?.toFixed(2) ?? "-"}]</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                    <span className="text-slate-500">Confidence</span>
                    <span className="font-mono text-slate-700 font-semibold tabular-nums">{result ? (result.confidence * 100).toFixed(0) + "%" : "\u2014"}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                    <span className="text-slate-500">Fast-Tracked</span>
                    <span className="font-mono text-slate-700 font-semibold">{result?.fast_tracked ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : "\u2014"}</span>
                  </div>
                </CardContent>
              </PremiumCard>

              {/* Vitals Snapshot — spans 1 col */}
              <PremiumCard className="border-l-emerald-500/40">
                <CardHeader className="pb-2 border-b border-slate-100 bg-emerald-50/30">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Vitals Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="space-y-2 text-[11px] font-medium">
                    {[
                      { label: "Heart Rate", val: vitals.heart_rate, unit: "bpm", lo: 60, hi: 100 },
                      { label: "MAP", val: vitals.map, unit: "mmHg", lo: 70, hi: 105 },
                      { label: "Temp", val: vitals.temperature, unit: "\u00b0C", lo: 36.0, hi: 38.3 },
                      { label: "SpO2", val: vitals.spo2, unit: "%", lo: 95, hi: 100 },
                      { label: "Lactate", val: vitals.lactate, unit: "mM", lo: 0.5, hi: 2.0 },
                    ].map((v) => {
                      const s = vitalStatus(v.val, v.lo, v.hi);
                      return (
                        <div key={v.label} className="flex justify-between items-center border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                          <span className="text-slate-500">{v.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-700 font-semibold tabular-nums">{v.val.toFixed(v.unit === "\u00b0C" || v.unit === "mM" ? 1 : 0)}</span>
                            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT_COLORS[s.label])} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </PremiumCard>

              {/* Pipeline Architecture — spans 1 col */}
              <PremiumCard className="border-l-slate-400/40">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Pipeline Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-2 text-xs font-medium">
                  <div className="flex justify-between items-center"><span className="text-slate-500">Backend</span><Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-bold shadow-sm text-[9px]">{result?.backend === "client_fallback" ? "Client Fallback" : "AWS EC2 API"}</Badge></div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2"><span className="text-slate-500">LSTM Weight</span><span className="font-mono text-slate-700 font-semibold tabular-nums">30%</span></div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2"><span className="text-slate-500">XGBoost Weight</span><span className="font-mono text-slate-700 font-semibold tabular-nums">70%</span></div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2"><span className="text-slate-500">Conformal q_a</span><span className="font-mono text-slate-700 font-semibold tabular-nums">0.2663</span></div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2"><span className="text-slate-500">Tripwires</span><span className="font-mono text-slate-700 font-semibold">7+2 imaging</span></div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2"><span className="text-slate-500">CXR Model</span><span className="font-mono text-slate-700 font-semibold">DenseNet121</span></div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2"><span className="text-slate-500">LLM Agent</span><span className="font-mono text-slate-700 font-semibold">Llama 3.2 3B</span></div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-2"><span className="text-slate-500">Normalization</span><span className="font-mono text-slate-700 font-semibold">MIMIC-IV</span></div>
                </CardContent>
              </PremiumCard>
            </motion.div>

            {/* Tripwires — full width below bento */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <PremiumCard className="border-l-amber-500/50" noBorderLeft>
                    <CardHeader className="pb-3 border-b border-slate-100 bg-amber-50/30">
                      <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                        <AlertTriangle className={cn("h-4 w-4", result.n_active_tripwires > 0 ? "text-amber-500" : "text-slate-400")} />
                        Clinical Tripwires
                        <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700 hover:bg-slate-200">{result.n_active_tripwires} active</Badge>
                        {result.has_extreme && <Badge variant="destructive" className="text-[9px] ml-auto bg-red-500 shadow-sm font-bold">EXTREME VALUE</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.tripwires.map((tw) => (
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            layout
                            key={tw.name} 
                            className={cn(
                              "p-3 rounded-xl border transition-colors",
                              tw.triggered
                                ? "border-red-200 bg-red-50/50 shadow-sm border-l-4 border-l-red-500"
                                : "border-slate-100 bg-slate-50/50 border-l-4 border-l-slate-200"
                            )}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={cn("text-xs font-bold", tw.triggered ? "text-red-700" : "text-slate-600")}>{tw.name}</span>
                              <span className={cn("font-mono text-xs font-semibold tabular-nums", tw.triggered ? "text-red-600" : "text-slate-500")}>{tw.value.toFixed(1)}</span>
                            </div>
                            <p className={cn("text-[11px] font-medium leading-relaxed", tw.triggered ? "text-red-600/80" : "text-slate-400")}>
                              {tw.triggered ? tw.reason : "Normal parameter range"}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </PremiumCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <PremiumCard className="border-l-blue-500/50">
                    <CardHeader className="pb-3 border-b border-blue-100/60 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Recommended Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <ul className="space-y-2">
                        {result.actions.map((a, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{a}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <p className="text-[11px] text-blue-800/80 font-medium leading-relaxed flex gap-2">
                          <Brain className="h-4 w-4 shrink-0 text-blue-500/70" />
                          {result.reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </PremiumCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phase 2: CXR Findings */}
            <AnimatePresence>
              {result?.cxr_findings && result.cxr_findings.findings && result.cxr_findings.findings.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <PremiumCard className="border-l-cyan-500/50 border-cyan-200 bg-gradient-to-b from-cyan-50/50 to-white shadow-cyan-900/5">
                    <CardHeader className="pb-3 border-b border-cyan-100/50">
                      <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-800 flex items-center gap-2">
                        <Upload className="h-4 w-4 text-cyan-600" /> CXR AI Findings
                        <Badge variant="outline" className="ml-auto border-cyan-200 text-cyan-700 bg-cyan-50 text-[9px] font-semibold">
                          DenseNet121 · CheXpert
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {result.cxr_findings.findings.map((f: { name: string; score: number; severity: string }, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm font-medium p-3 bg-white rounded-xl border border-cyan-100 shadow-sm">
                          <span className="text-slate-700 font-semibold">{f.name}</span>
                          <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5",
                            f.severity === "HIGH" ? "border-red-200 text-red-700 bg-red-50" : "border-amber-200 text-amber-700 bg-amber-50"
                          )}>
                            {(f.score * 100).toFixed(0)}% · {f.severity}
                          </Badge>
                        </div>
                      ))}
                      <div className="pt-3 mt-1 border-t border-cyan-100">
                        <p className="text-[11px] text-cyan-800 font-medium flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-cyan-500" />
                          Risk modifier: +{((result.cxr_findings.risk_modifier || 0) * 100).toFixed(1)}% | {result.cxr_findings.summary}
                        </p>
                      </div>
                    </CardContent>
                  </PremiumCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phase 2: Clinical AI Narrative */}
            <AnimatePresence>
              {result?.clinical_narrative && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <PremiumCard className="border-l-violet-500/50 border-violet-200 bg-gradient-to-b from-violet-50/50 to-white shadow-violet-900/5">
                    <CardHeader className="pb-3 border-b border-violet-100/50">
                      <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-violet-800 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-violet-600" /> Clinical AI Assessment
                        <Badge variant="outline" className="ml-auto border-violet-200 text-violet-700 bg-violet-50 text-[9px] font-semibold">
                          Llama 3.2 3B
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {result.clinical_narrative}
                      </p>
                    </CardContent>
                  </PremiumCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phase 2: Demographics Note */}
            <AnimatePresence>
              {result?.demographics && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 py-2">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Patient context: <span className="text-slate-700 font-bold tabular-nums">{result.demographics.age}y {result.demographics.gender}</span> — <span className="leading-relaxed">{result.demographics.age_risk_note}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── RIGHT: Timeline ────────────────────────── */}
          <motion.div variants={fadeInUp} className="lg:col-span-3 space-y-5">
            <PremiumCard className="border-l-sky-500/40">
              <CardHeader className="pb-3 border-b border-slate-100 bg-sky-50/30">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Risk Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {history.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-xs text-slate-400 font-medium text-center px-4 leading-relaxed">
                      Adjust vitals or run simulation to build timeline
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Simple bar chart */}
                    <div className="flex items-end gap-[3px] h-32 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      {history.slice(-30).map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end min-w-[4px] group relative">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(4, h.risk * 100)}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={cn("rounded-sm w-full transition-colors", 
                              h.risk > 0.5 ? "bg-red-500 group-hover:bg-red-400" : h.risk > 0.3 ? "bg-amber-400 group-hover:bg-amber-300" : "bg-emerald-400 group-hover:bg-emerald-300")}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 px-1 tabular-nums">
                      <span>{history[0]?.time}</span>
                      <span>{history[history.length - 1]?.time}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </PremiumCard>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

/* ── Slider component ──────────────────────────────────────── */
function VitalSlider({ icon, label, unit, value, min, max, step, onChange }: {
  icon: React.ReactNode; label: string; unit: string;
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">{icon} {label}</div>
        <span className="text-sm font-mono font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 tabular-nums">
          {step < 1 ? value.toFixed(1) : value} <span className="text-[10px] text-slate-500 ml-0.5">{unit}</span>
        </span>
      </div>
      <Slider
        min={min} max={max} step={step} value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="py-1 cursor-pointer"
      />
    </div>
  );
}
