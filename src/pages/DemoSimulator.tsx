import { useState, useEffect, useCallback, useRef } from "react";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  predict, SCENARIOS,
  type VitalInputs, type PredictionResult, type AlertLevel,
} from "@/lib/demoEngine";
import {
  Shield, Activity, AlertTriangle, Heart, Thermometer,
  Wind, Droplets, Brain, Zap, Play, Pause, RotateCcw,
  Timer, Clock, ChevronRight, Upload, User, Stethoscope
} from "lucide-react";

/* ── helpers ───────────────────────────────────────────────── */
const TIER_COLORS: Record<AlertLevel, string> = {
  WATCH: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  AMBER: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  CRITICAL: "bg-red-500/20 text-red-400 border-red-500/40",
  "FAST-TRACK": "bg-purple-500/20 text-purple-400 border-purple-500/40",
};
const TIER_BG: Record<AlertLevel, string> = {
  WATCH: "border-emerald-500/30 bg-emerald-950/20",
  AMBER: "border-amber-500/30 bg-amber-950/20",
  CRITICAL: "border-red-500/40 bg-red-950/30 animate-pulse",
  "FAST-TRACK": "border-purple-500/30 bg-purple-950/20",
};

function vitalStatus(val: number, lo: number, hi: number) {
  if (val < lo) return { label: "LOW", cls: "text-blue-400" };
  if (val > hi) return { label: "HIGH", cls: "text-red-400" };
  return { label: "NORMAL", cls: "text-emerald-400" };
}

type DemoMode = "instant" | "manual" | "simulated";

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
  const gaugeRadius = 45;
  const gaugeCirc = Math.PI * gaugeRadius;
  const gaugeOffset = result ? gaugeCirc - (result.risk_score * gaugeCirc) : gaugeCirc;
  const gaugeColor = !result ? "#334155" :
    result.alert_level === "CRITICAL" ? "#ef4444" :
    result.alert_level === "AMBER" ? "#f59e0b" : "#22c55e";

  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />

      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold">Demo Simulator</h1>
            <Badge variant="outline" className="text-[10px] font-mono">
              {result ? (result.backend === "client_fallback" ? "fallback" : result.backend) : "ensemble"}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/40">
              {mode === "instant" ? "⚡ Instant" : mode === "manual" ? "🖱️ Manual" : "⏱️ 15-min Cycle"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {/* Mode selector */}
            <div className="flex items-center gap-2">
              <Label className="text-[10px] font-mono text-muted-foreground">Mode:</Label>
              <Select value={mode} onValueChange={(v) => { setMode(v as DemoMode); setSimRunning(false); }}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">⚡ Demo Instant</SelectItem>
                  <SelectItem value="manual">🖱️ Manual (click)</SelectItem>
                  <SelectItem value="simulated">⏱️ 15-min Cycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ── LEFT: Controls ─────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Scenario */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Patient Scenario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select value={scenario} onValueChange={setScenario}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SCENARIOS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {SCENARIOS[scenario]?.description}
                </p>
              </CardContent>
            </Card>

            {/* Phase 2: Demographics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Patient Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <VitalSlider icon={<User className="h-3 w-3" />} label="Age" unit="yrs" value={vitals.age} min={18} max={100} step={1} onChange={(v) => updateVital("age", v)} />
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
                    <User className="h-3 w-3" /> Gender
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={vitals.gender === "M" ? "default" : "outline"}
                      onClick={() => setVitals(prev => ({ ...prev, gender: "M" as const }))}
                      className="text-xs px-4 h-7"
                    >Male</Button>
                    <Button size="sm" variant={vitals.gender === "F" ? "default" : "outline"}
                      onClick={() => setVitals(prev => ({ ...prev, gender: "F" as const }))}
                      className="text-xs px-4 h-7"
                    >Female</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phase 2: CXR Upload */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" /> Chest X-Ray
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
                <Button size="sm" variant="outline" className="w-full text-xs h-8"
                  onClick={() => document.getElementById("cxr-upload")?.click()}
                >
                  <Upload className="h-3 w-3 mr-1.5" />
                  {cxrFile ? "Change X-Ray" : "Upload CXR Image"}
                </Button>
                {cxrFile && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-emerald-400 font-mono">✓ {cxrFile.name}</p>
                    {cxrPreview && (
                      <img src={cxrPreview} alt="CXR Preview" className="w-full h-28 object-cover rounded border border-slate-700" />
                    )}
                    <Button size="sm" variant="ghost" className="text-[10px] text-red-400 h-6 px-2"
                      onClick={() => {
                        setCxrFile(null);
                        setCxrPreview(null);
                        setVitals(prev => { const { cxr_image_base64, ...rest } = prev; return { ...rest } as typeof prev; });
                      }}
                    >Remove</Button>
                  </div>
                )}
                {!cxrFile && (
                  <p className="text-[10px] text-muted-foreground">Upload a chest X-ray JPEG for AI-powered pulmonary analysis</p>
                )}
              </CardContent>
            </Card>

            {/* Vital Sliders */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" /> Vital Signs Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <VitalSlider icon={<Heart className="h-3 w-3" />} label="Heart Rate" unit="bpm" value={vitals.heart_rate} min={30} max={200} step={1} onChange={(v) => updateVital("heart_rate", v)} />
                <VitalSlider icon={<Droplets className="h-3 w-3" />} label="MAP" unit="mmHg" value={vitals.map} min={30} max={140} step={1} onChange={(v) => updateVital("map", v)} />
                <VitalSlider icon={<Thermometer className="h-3 w-3" />} label="Temperature" unit="°C" value={vitals.temperature} min={33} max={42} step={0.1} onChange={(v) => updateVital("temperature", v)} />
                <VitalSlider icon={<Wind className="h-3 w-3" />} label="Resp Rate" unit="br/min" value={vitals.resp_rate} min={5} max={45} step={1} onChange={(v) => updateVital("resp_rate", v)} />
                <VitalSlider icon={<Droplets className="h-3 w-3" />} label="SpO₂" unit="%" value={vitals.spo2} min={70} max={100} step={1} onChange={(v) => updateVital("spo2", v)} />
                <VitalSlider icon={<Brain className="h-3 w-3" />} label="GCS" unit="" value={vitals.gcs_total} min={3} max={15} step={1} onChange={(v) => updateVital("gcs_total", v)} />
                <VitalSlider icon={<Zap className="h-3 w-3" />} label="Lactate" unit="mmol/L" value={vitals.lactate} min={0.5} max={15} step={0.1} onChange={(v) => updateVital("lactate", v)} />
                <VitalSlider icon={<Activity className="h-3 w-3" />} label="WBC" unit="K/µL" value={vitals.wbc} min={0.5} max={40} step={0.5} onChange={(v) => updateVital("wbc", v)} />
                <VitalSlider icon={<Activity className="h-3 w-3" />} label="Creatinine" unit="mg/dL" value={vitals.creatinine} min={0.3} max={8} step={0.1} onChange={(v) => updateVital("creatinine", v)} />
                <VitalSlider icon={<Activity className="h-3 w-3" />} label="Platelets" unit="K/µL" value={vitals.platelets} min={10} max={400} step={5} onChange={(v) => updateVital("platelets", v)} />
              </CardContent>
            </Card>

            {/* Action buttons */}
            {mode === "manual" && (
              <Button className="w-full" onClick={runPrediction} disabled={isLoading}>
                {isLoading ? <span className="animate-pulse">Loading...</span> : <><Play className="h-4 w-4 mr-2" /> Run Prediction</>}
              </Button>
            )}
            {mode === "simulated" && (
              <div className="flex gap-2">
                <Button className="flex-1" variant={simRunning ? "destructive" : "default"} onClick={() => setSimRunning(!simRunning)}>
                  {simRunning ? <><Pause className="h-4 w-4 mr-1" /> Pause</> : <><Play className="h-4 w-4 mr-1" /> Start</>}
                </Button>
                <Button variant="outline" onClick={() => { runPrediction(); setSimStep((s) => s + 1); }}>
                  <ChevronRight className="h-4 w-4" /> Step
                </Button>
                <Button variant="outline" onClick={() => { setSimStep(0); setHistory([]); setSimRunning(false); }}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
            {mode === "simulated" && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <Timer className="h-3 w-3" />
                Step {simStep} · {simStep * 15} min elapsed
              </div>
            )}
          </div>

          {/* ── CENTER: Results ─────────────────────────── */}
          <div className="lg:col-span-6 space-y-4">
            {/* Alert Banner */}
            {result && (
              <div className={cn("border rounded-lg p-4 text-center", TIER_BG[result.alert_level])}>
                <p className="text-lg font-mono font-black tracking-wider">
                  ALERT: {result.alert_level} | Risk {(result.risk_score * 100).toFixed(1)}% | Confidence {(result.confidence * 100).toFixed(0)}%
                </p>
                {result.fast_tracked && (
                  <p className="text-xs font-mono mt-1 text-purple-400">⚡ FAST-TRACKED due to low confidence</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Risk Gauge */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Ensemble Risk Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative w-40 h-24">
                    <svg viewBox="0 0 100 55" className="w-full h-full">
                      <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="hsl(220, 13%, 18%)" strokeWidth="6" strokeLinecap="round" />
                      <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke={gaugeColor} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${gaugeCirc}`} strokeDashoffset={gaugeOffset}
                        style={{ transition: "stroke-dashoffset 0.6s ease-out, stroke 0.3s" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                      <span className="text-3xl font-mono font-black" style={{ color: gaugeColor }}>
                        {result ? (result.risk_score * 100).toFixed(1) : "—"}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">0% (Safe) — 100% (Septic)</p>
                </CardContent>
              </Card>

              {/* Decision Summary */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Decision Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alert Level</span>
                    <Badge className={cn("text-[10px]", result ? TIER_COLORS[result.alert_level] : "")}>{result?.alert_level ?? "—"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tripwires</span>
                    <span className="font-mono font-bold">{result?.n_active_tripwires ?? 0} / 7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LSTM Score</span>
                    <span className="font-mono">{result?.lstm_score?.toFixed(3) ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">XGBoost Score</span>
                    <span className="font-mono">{result?.xgb_score?.toFixed(3) ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conformal</span>
                    <span className="font-mono text-[10px]">[{result?.conformal_interval?.[0]?.toFixed(3) ?? "—"}, {result?.conformal_interval?.[1]?.toFixed(3) ?? "—"}]</span>
                  </div>
                </CardContent>
              </Card>

              {/* Vitals Snapshot */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Vital Signs Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-[11px] font-mono">
                    {[
                      { label: "Heart Rate", val: vitals.heart_rate, unit: "bpm", lo: 60, hi: 100 },
                      { label: "MAP", val: vitals.map, unit: "mmHg", lo: 70, hi: 105 },
                      { label: "Temp", val: vitals.temperature, unit: "°C", lo: 36.0, hi: 38.3 },
                      { label: "RR", val: vitals.resp_rate, unit: "br/m", lo: 12, hi: 20 },
                      { label: "SpO₂", val: vitals.spo2, unit: "%", lo: 95, hi: 100 },
                      { label: "GCS", val: vitals.gcs_total, unit: "", lo: 14, hi: 15 },
                      { label: "Lactate", val: vitals.lactate, unit: "mmol/L", lo: 0.5, hi: 2.0 },
                    ].map((v) => {
                      const s = vitalStatus(v.val, v.lo, v.hi);
                      return (
                        <div key={v.label} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{v.label}</span>
                          <div className="flex items-center gap-2">
                            <span>{v.val.toFixed(v.unit === "°C" || v.unit === "mmol/L" ? 1 : 0)} {v.unit}</span>
                            <span className={cn("text-[9px] font-bold w-14 text-right", s.cls)}>{s.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tripwires */}
            {result && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Red Team Clinical Tripwires ({result.n_active_tripwires} active)
                    {result.has_extreme && <Badge variant="destructive" className="text-[9px] ml-2">EXTREME VALUE</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.tripwires.map((tw) => (
                      <div key={tw.name} className={cn(
                        "p-2 rounded border text-xs font-mono",
                        tw.triggered
                          ? "border-red-500/40 bg-red-950/20 text-red-300"
                          : "border-border bg-card text-muted-foreground"
                      )}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{tw.name}</span>
                          <span>{tw.value.toFixed(1)}</span>
                        </div>
                        <p className="text-[10px] mt-0.5 opacity-70">
                          {tw.triggered ? tw.reason : "Normal"}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {result && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {result.actions.map((a, i) => (
                    <p key={i} className="text-xs font-mono text-foreground">{a}</p>
                  ))}
                  <p className="text-[10px] text-muted-foreground mt-2 italic">{result.reasoning}</p>
                </CardContent>
              </Card>
            )}

            {/* Phase 2: CXR Findings */}
            {result?.cxr_findings && result.cxr_findings.findings && result.cxr_findings.findings.length > 0 && (
              <Card className="border-cyan-500/30 bg-cyan-950/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    📷 Chest X-Ray Findings
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-[9px] font-normal">
                      DenseNet121 · CheXpert
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.cxr_findings.findings.map((f: { name: string; score: number; severity: string }, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300">{f.name}</span>
                      <Badge variant="outline" className={cn("text-[10px]",
                        f.severity === "HIGH" ? "border-red-500/50 text-red-400" : "border-amber-500/50 text-amber-400"
                      )}>
                        {(f.score * 100).toFixed(0)}% · {f.severity}
                      </Badge>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-cyan-500/20">
                    <p className="text-[10px] text-cyan-300/70 font-mono">
                      Risk modifier: +{((result.cxr_findings.risk_modifier || 0) * 100).toFixed(1)}% | {result.cxr_findings.summary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Phase 2: Clinical AI Narrative */}
            {result?.clinical_narrative && (
              <Card className="border-violet-500/30 bg-violet-950/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-violet-400 flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5" /> Clinical AI Assessment
                    <Badge variant="outline" className="border-violet-500/40 text-violet-400 text-[9px] font-normal">
                      Llama 3.2 3B
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {result.clinical_narrative}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Phase 2: Demographics Note */}
            {result?.demographics && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground px-1">
                <User className="h-3 w-3" />
                Patient: {result.demographics.age}y {result.demographics.gender} — {result.demographics.age_risk_note}
              </div>
            )}
          </div>

          {/* ── RIGHT: Timeline ────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Risk Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Change vitals to build timeline...
                  </p>
                ) : (
                  <div className="space-y-1">
                    {/* Simple bar chart */}
                    <div className="flex items-end gap-[2px] h-32">
                      {history.slice(-30).map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end min-w-[3px]">
                          <div
                            className={cn("rounded-t-sm min-h-[2px] transition-all", 
                              h.risk > 0.5 ? "bg-red-500" : h.risk > 0.3 ? "bg-amber-500" : "bg-emerald-500")}
                            style={{ height: `${Math.max(2, h.risk * 100)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                      <span>{history[0]?.time}</span>
                      <span>{history[history.length - 1]?.time}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pipeline Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Pipeline Info
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[11px] font-mono space-y-1 text-muted-foreground">
                <div className="flex justify-between"><span>Backend</span><span className="text-primary">{result?.backend === "client_fallback" ? "Client Fallback" : "AWS EC2 API"}</span></div>
                <div className="flex justify-between"><span>LSTM Weight</span><span>30%</span></div>
                <div className="flex justify-between"><span>XGBoost Weight</span><span>70%</span></div>
                <div className="flex justify-between"><span>Conformal q_α</span><span>0.2663</span></div>
                <div className="flex justify-between"><span>Tripwires</span><span>7+2 imaging</span></div>
                <div className="flex justify-between"><span>CXR Model</span><span>DenseNet121</span></div>
                <div className="flex justify-between"><span>LLM Agent</span><span>Llama 3.2 3B</span></div>
                <div className="flex justify-between"><span>Normalization</span><span>MIMIC-IV</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
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
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{icon} {label}</div>
        <span className="text-xs font-mono font-bold text-foreground">
          {step < 1 ? value.toFixed(1) : value} {unit}
        </span>
      </div>
      <Slider
        min={min} max={max} step={step} value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="py-1"
      />
    </div>
  );
}
