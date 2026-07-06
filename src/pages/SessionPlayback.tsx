import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GlobalNav } from "@/components/layout/GlobalNav";
import {
  Shield, Activity, Play, Pause, Square, Upload, FileText,
  SkipForward, AlertCircle, Heart, Wind, Thermometer, Droplets,
  ChevronRight, Zap, TrendingUp, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { predict } from "@/lib/demoEngine";

/* ───────────────────── Types ───────────────────── */

interface CsvRow {
  timestamp: string;
  bp_sys: number;
  bp_dia: number;
  spo2: number;
  pulse: number;
  resp_rate: number;
  stiffness: string;
  arrhythmia: string;
  signal_quality: string;
  finger: boolean;
}

interface ConstantVitals {
  temperature: number;
  gcs_total: number;
  lactate: number;
  wbc: number;
  creatinine: number;
  platelets: number;
  age: number;
  gender: string;
}

interface PredictionResult {
  risk_score: number;
  lstm_score: number;
  xgb_score?: number;
  confidence: number;
  conformal_interval: [number, number];
  alert_level: "WATCH" | "AMBER" | "CRITICAL" | "FAST-TRACK";
  fast_tracked: boolean;
  tripwires: Array<{
    name: string;
    triggered: boolean;
    value: number;
    threshold: string;
    reason: string;
  }>;
  n_active_tripwires: number;
  reasoning: string;
  actions: string[];
  backend: string;
  clinical_narrative?: string;
}

interface TimelinePrediction {
  index: number;
  timestamp: string;
  result: PredictionResult;
}

/* ───────────────────── Helpers ───────────────────── */

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  // Skip header
  return lines.slice(1).map((line) => {
    const parts = line.split(",");
    return {
      timestamp: parts[0]?.trim() ?? "",
      bp_sys: parseFloat(parts[1]) || 120,
      bp_dia: parseFloat(parts[2]) || 80,
      spo2: parseFloat(parts[3]) || 0, // 0 means missing
      pulse: parseFloat(parts[4]) || 0, // 0 means missing
      resp_rate: parseFloat(parts[5]) || 16,
      stiffness: parts[6]?.trim() ?? "Normal",
      arrhythmia: parts[7]?.trim() ?? "Sinus rhythm",
      signal_quality: parts[8]?.trim() ?? "Unknown",
      finger: parts[9]?.trim().toLowerCase() === "true",
    };
  });
}

function getAlertColor(level: string) {
  switch (level) {
    case "WATCH": return "from-emerald-500/30 to-emerald-600/10 border-emerald-500/50 text-emerald-400";
    case "AMBER": return "from-amber-500/30 to-amber-600/10 border-amber-500/50 text-amber-400";
    case "CRITICAL": return "from-red-500/30 to-red-600/10 border-red-500/50 text-red-400";
    case "FAST-TRACK": return "from-red-600/40 to-red-700/20 border-red-600/70 text-red-300";
    default: return "from-gray-500/20 to-gray-600/10 border-gray-500/50 text-gray-400";
  }
}

function getAlertBadgeClass(level: string) {
  switch (level) {
    case "WATCH": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    case "AMBER": return "bg-amber-500/20 text-amber-400 border-amber-500/50";
    case "CRITICAL": return "bg-red-500/20 text-red-400 border-red-500/50";
    case "FAST-TRACK": return "bg-red-600/30 text-red-300 border-red-600/70";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  }
}

/* ───────────────────── Sub-components ───────────────────── */

function VitalGauge({
  icon: Icon, label, value, unit, color, min, max, warning, critical
}: {
  icon: any; label: string; value: number; unit: string; color: string;
  min: number; max: number; warning?: number; critical?: number;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const isWarning = warning !== undefined && (value >= warning || value <= min + (max - min) * 0.1);
  const isCritical = critical !== undefined && (value >= critical || value <= min + (max - min) * 0.05);
  const statusColor = isCritical ? "text-red-400" : isWarning ? "text-amber-400" : color;

  return (
    <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
      isCritical
        ? "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10"
        : isWarning
        ? "border-amber-500/40 bg-amber-500/5"
        : "border-white/10 bg-white/5"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${statusColor}`} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        {isCritical && <span className="text-[9px] font-bold text-red-400 animate-pulse">⚠ CRITICAL</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold font-mono tabular-nums ${statusColor} transition-all duration-500`}>
          {value === 0 ? "---" : value.toFixed(0)}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-gradient-to-r " + color.replace("text-", "from-") + " to-white/50"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MiniRiskChart({ predictions }: { predictions: TimelinePrediction[] }) {
  if (predictions.length === 0) return null;

  const maxPoints = 30;
  const pts = predictions.slice(-maxPoints);
  const width = 100;
  const height = 50;

  const pathData = pts.map((p, i) => {
    const x = (i / (maxPoints - 1)) * width;
    const y = height - (p.result.risk_score * height);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  const areaData = pathData + ` L ${((pts.length - 1) / (maxPoints - 1) * width).toFixed(1)} ${height} L 0 ${height} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
        {/* Danger zone background */}
        <rect x="0" y="0" width={width} height={height * 0.3} fill="rgba(239,68,68,0.05)" />
        {/* Threshold lines */}
        <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(234,179,8,0.2)" strokeDasharray="2 2" />
        <line x1="0" y1={height * 0.3} x2={width} y2={height * 0.3} stroke="rgba(239,68,68,0.2)" strokeDasharray="2 2" />
        {/* Area fill */}
        <path d={areaData} fill="url(#riskGradient)" opacity="0.3" />
        {/* Line */}
        <path d={pathData} fill="none" stroke="url(#riskLineGradient)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Last point dot */}
        {pts.length > 0 && (() => {
          const last = pts[pts.length - 1];
          const x = ((pts.length - 1) / (maxPoints - 1)) * width;
          const y = height - (last.result.risk_score * height);
          return <circle cx={x} cy={y} r="2.5" fill="#22d3ee" className="animate-pulse" />;
        })()}
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="riskLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-0.5">
        <span>0%</span>
        <span className="text-amber-500/60">50%</span>
        <span className="text-red-500/60">100%</span>
      </div>
    </div>
  );
}

/* ───────────────────── Main Page ───────────────────── */

type PlaybackPhase = "upload" | "configure" | "playing" | "paused" | "finished";

export default function SessionPlayback() {
  const { toast } = useToast();

  // Data state
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [missingStats, setMissingStats] = useState<{ spo2: number; pulse: number }>({ spo2: 0, pulse: 0 });

  // Config state — defaults for unmeasured vitals
  const [constants, setConstants] = useState<ConstantVitals>({
    temperature: 37.2,
    gcs_total: 15,
    lactate: 1.2,
    wbc: 9.5,
    creatinine: 1.0,
    platelets: 210,
    age: 55,
    gender: "M",
  });

  // Playback state
  const [phase, setPhase] = useState<PlaybackPhase>("upload");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(5); // multiplier
  const [predictionInterval, setPredictionInterval] = useState(30); // rows between predictions
  const [predictions, setPredictions] = useState<TimelinePrediction[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragOverRef = useRef(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Current row
  const currentRow = csvData[currentIndex] ?? null;

  // Auto-fill missing values with forward-fill from last valid reading
  const getEffectiveRow = useCallback((index: number): CsvRow | null => {
    if (index < 0 || index >= csvData.length) return null;
    const row = { ...csvData[index] };
    if (row.spo2 === 0 || isNaN(row.spo2)) {
      // Forward-fill from previous valid
      for (let i = index - 1; i >= 0; i--) {
        if (csvData[i].spo2 > 0) { row.spo2 = csvData[i].spo2; break; }
      }
      if (row.spo2 === 0) row.spo2 = 97; // fallback
    }
    if (row.pulse === 0 || isNaN(row.pulse)) {
      for (let i = index - 1; i >= 0; i--) {
        if (csvData[i].pulse > 0) { row.pulse = csvData[i].pulse; break; }
      }
      if (row.pulse === 0) row.pulse = 72; // fallback
    }
    return row;
  }, [csvData]);

  // File upload handler
  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a .csv file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast({ title: "Empty CSV", description: "No data rows found in the file", variant: "destructive" });
        return;
      }
      setCsvData(rows);
      setFileName(file.name);
      setCurrentIndex(0);
      setPredictions([]);
      setLatestPrediction(null);
      // Count missing
      const missSpo2 = rows.filter(r => r.spo2 === 0 || isNaN(r.spo2)).length;
      const missPulse = rows.filter(r => r.pulse === 0 || isNaN(r.pulse)).length;
      setMissingStats({ spo2: missSpo2, pulse: missPulse });
      setPhase("configure");
      toast({ title: "CSV Loaded", description: `${rows.length} data points from ${file.name}` });
    };
    reader.readAsText(file);
  }, [toast]);

  // Prediction call
  const runPrediction = useCallback(async (row: CsvRow, idx: number) => {
    const mapValue = Math.round((row.bp_sys + 2 * row.bp_dia) / 3);
    const body = {
      heart_rate: row.pulse,
      map: mapValue,
      temperature: constants.temperature,
      resp_rate: row.resp_rate,
      spo2: row.spo2,
      gcs_total: constants.gcs_total,
      lactate: constants.lactate,
      wbc: constants.wbc,
      creatinine: constants.creatinine,
      platelets: constants.platelets,
      age: constants.age,
      gender: constants.gender as "M" | "F",
    };
    setIsPredicting(true);
    try {
      // Use local demo engine for guaranteed data shape and fast playback
      const result: any = predict(body);
      const entry: TimelinePrediction = { index: idx, timestamp: row.timestamp, result };
      setPredictions(prev => [...prev, entry]);
      setLatestPrediction(result);
    } catch (err: any) {
      console.error("Prediction failed:", err);
      toast({ title: "Prediction failed", description: err.message, variant: "destructive" });
    } finally {
      setIsPredicting(false);
    }
  }, [constants, toast]);

  // Playback engine
  useEffect(() => {
    if (phase !== "playing") return;

    const baseInterval = 750; // ms per row at 1x speed
    const interval = baseInterval / speed;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= csvData.length) {
          setPhase("finished");
          return prev;
        }
        // Trigger prediction at interval
        if (next % predictionInterval === 0) {
          const effectiveRow = getEffectiveRow(next);
          if (effectiveRow) runPrediction(effectiveRow, next);
        }
        return next;
      });
      setElapsedTime(prev => prev + 1);
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, speed, csvData.length, predictionInterval, getEffectiveRow, runPrediction]);

  // Controls
  const handlePlay = () => {
    if (phase === "configure" || phase === "paused") {
      // Run initial prediction at start
      if (phase === "configure" && csvData.length > 0) {
        const row = getEffectiveRow(0);
        if (row) runPrediction(row, 0);
      }
      setPhase("playing");
    }
  };
  const handlePause = () => { if (phase === "playing") setPhase("paused"); };
  const handleStop = () => {
    setPhase("configure");
    setCurrentIndex(0);
    setElapsedTime(0);
  };
  const handleSeek = (value: number[]) => {
    const idx = Math.floor((value[0] / 100) * (csvData.length - 1));
    setCurrentIndex(idx);
  };

  const effectiveRow = getEffectiveRow(currentIndex);

  // Duration string
  const formatTime = (rows: number) => {
    const secs = rows; // roughly 1 row per second in original data
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ───────── Render ───────── */
  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />

      <main className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
            <Activity className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Session Playback</h1>
            <p className="text-sm text-muted-foreground">
              Upload sensor recordings from Jetson Nano and replay with live ML predictions
            </p>
          </div>
        </div>

        {/* ─── Upload Phase ─── */}
        {phase === "upload" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-dashed border-2 border-white/10 hover:border-cyan-500/30 transition-colors">
              <CardContent className="p-12">
                <div
                  className={`flex flex-col items-center justify-center text-center transition-all duration-200 ${
                    isDragOver ? "scale-105" : ""
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                  }}
                >
                  <div className={`p-6 rounded-2xl mb-4 transition-all duration-300 ${
                    isDragOver
                      ? "bg-cyan-500/20 border border-cyan-500/40"
                      : "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/5"
                  }`}>
                    <Upload className={`h-12 w-12 ${isDragOver ? "text-cyan-400 animate-bounce" : "text-muted-foreground/50"}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {isDragOver ? "Drop your CSV file" : "Upload Sensor Recording"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag & drop a <code className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded text-xs">session_log_*.csv</code> file from Jetson Nano
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                    />
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span><FileText className="h-4 w-4 mr-2" />Browse Files</span>
                    </Button>
                  </label>
                  <p className="text-[10px] text-muted-foreground/60 mt-4 font-mono">
                    Expected columns: Timestamp, BP Sys, BP Dia, SpO2, Pulse, Resp Rate, ...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Configure Phase ─── */}
        {phase === "configure" && csvData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* CSV Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" /> Recording Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File</span>
                    <span className="font-mono text-cyan-400 truncate max-w-[160px]">{fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Points</span>
                    <span className="font-mono">{csvData.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-mono">~{formatTime(csvData.length)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start</span>
                    <span className="font-mono text-[10px]">{csvData[0]?.timestamp.split("T")[1]?.substring(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End</span>
                    <span className="font-mono text-[10px]">{csvData[csvData.length - 1]?.timestamp.split("T")[1]?.substring(0, 8)}</span>
                  </div>
                </div>
                {(missingStats.spo2 > 0 || missingStats.pulse > 0) && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px]">
                    <div className="flex items-center gap-1 text-amber-400 font-medium mb-1">
                      <AlertCircle className="h-3 w-3" /> Missing Values (auto-filled)
                    </div>
                    {missingStats.spo2 > 0 && <div className="text-muted-foreground">SpO2: {missingStats.spo2} rows</div>}
                    {missingStats.pulse > 0 && <div className="text-muted-foreground">Pulse: {missingStats.pulse} rows</div>}
                  </div>
                )}
                {/* Data preview */}
                <div className="text-[10px] font-mono">
                  <div className="text-muted-foreground mb-1">First 5 rows:</div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-muted-foreground/60">
                          <th className="pr-2 text-left">#</th>
                          <th className="pr-2 text-right">BP</th>
                          <th className="pr-2 text-right">SpO2</th>
                          <th className="pr-2 text-right">Pulse</th>
                          <th className="pr-2 text-right">RR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="pr-2 text-muted-foreground">{i + 1}</td>
                            <td className="pr-2 text-right">{row.bp_sys}/{row.bp_dia}</td>
                            <td className={`pr-2 text-right ${row.spo2 === 0 ? "text-amber-400" : ""}`}>
                              {row.spo2 === 0 ? "—" : row.spo2}
                            </td>
                            <td className={`pr-2 text-right ${row.pulse === 0 ? "text-amber-400" : ""}`}>
                              {row.pulse === 0 ? "—" : row.pulse}
                            </td>
                            <td className="pr-2 text-right">{row.resp_rate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Constant Vitals Config */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-purple-400" /> Constant Vitals
                </CardTitle>
                <CardDescription className="text-[10px]">
                  These values stay fixed during playback (no sensor data for these)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "temperature", label: "Temperature (°C)", min: 35, max: 41, step: 0.1 },
                    { key: "gcs_total", label: "GCS Total", min: 3, max: 15, step: 1 },
                    { key: "lactate", label: "Lactate (mmol/L)", min: 0.1, max: 15, step: 0.1 },
                    { key: "wbc", label: "WBC (×10³/µL)", min: 1, max: 30, step: 0.1 },
                    { key: "creatinine", label: "Creatinine (mg/dL)", min: 0.1, max: 10, step: 0.1 },
                    { key: "platelets", label: "Platelets (×10³/µL)", min: 10, max: 500, step: 5 },
                    { key: "age", label: "Age (years)", min: 18, max: 100, step: 1 },
                  ].map(({ key, label, min, max, step }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{label}</Label>
                      <Input
                        type="number"
                        min={min} max={max} step={step}
                        value={constants[key as keyof ConstantVitals]}
                        onChange={(e) => setConstants(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Gender</Label>
                    <select
                      value={constants.gender}
                      onChange={(e) => setConstants(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs font-mono"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Playback Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Play className="h-4 w-4 text-emerald-400" /> Playback Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground">Speed: {speed}× real-time</Label>
                  <div className="flex gap-2">
                    {[1, 2, 5, 10, 20].map((s) => (
                      <Button
                        key={s} size="sm" variant={speed === s ? "default" : "outline"}
                        className="text-xs flex-1 h-7"
                        onClick={() => setSpeed(s)}
                      >
                        {s}×
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground">
                    Predict every {predictionInterval} rows (~{predictionInterval}s of recording)
                  </Label>
                  <div className="flex gap-2">
                    {[15, 30, 60, 100].map((n) => (
                      <Button
                        key={n} size="sm" variant={predictionInterval === n ? "default" : "outline"}
                        className="text-xs flex-1 h-7"
                        onClick={() => setPredictionInterval(n)}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 space-y-2">
                  <Button onClick={handlePlay} className="w-full gap-2" size="lg">
                    <Play className="h-5 w-5" />
                    Start Playback
                  </Button>
                  <Button
                    variant="outline" className="w-full gap-2"
                    onClick={() => {
                      setPhase("upload");
                      setCsvData([]);
                      setPredictions([]);
                      setLatestPrediction(null);
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    Load Different File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Playback / Paused / Finished ─── */}
        {(phase === "playing" || phase === "paused" || phase === "finished") && effectiveRow && (
          <div className="space-y-4">
            {/* Transport Controls */}
            <Card className="border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-transparent">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Play/Pause/Stop */}
                  <div className="flex items-center gap-1">
                    {phase === "playing" ? (
                      <Button size="icon" variant="ghost" onClick={handlePause} className="h-8 w-8">
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={handlePlay} className="h-8 w-8"
                        disabled={phase === "finished"}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={handleStop} className="h-8 w-8">
                      <Square className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Status badge */}
                  <Badge variant="outline" className={`text-[10px] ${
                    phase === "playing" ? "border-emerald-500/50 text-emerald-400" :
                    phase === "paused" ? "border-amber-500/50 text-amber-400" :
                    "border-muted-foreground/50 text-muted-foreground"
                  }`}>
                    {phase === "playing" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse inline-block" />}
                    {phase.toUpperCase()}
                  </Badge>

                  {/* Speed selector */}
                  <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                    {[1, 2, 5, 10, 20].map(s => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                          speed === s
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>

                  {/* Progress & Time */}
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {formatTime(currentIndex)} / {formatTime(csvData.length)}
                    </span>
                    <Slider
                      value={[csvData.length > 1 ? (currentIndex / (csvData.length - 1)) * 100 : 0]}
                      onValueChange={handleSeek}
                      max={100}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      Row {currentIndex + 1}/{csvData.length}
                    </span>
                  </div>

                  {/* Prediction count */}
                  <Badge variant="outline" className="text-[10px] border-purple-500/40 text-purple-400">
                    <Zap className="h-3 w-3 mr-1" />
                    {predictions.length} predictions
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* ─── Bedside Monitor ─── */}
              <div className="lg:col-span-2 space-y-4">
                {/* Vital Gauges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <VitalGauge
                    icon={Heart} label="Heart Rate" value={effectiveRow.pulse}
                    unit="bpm" color="text-rose-400" min={30} max={180}
                    warning={100} critical={130}
                  />
                  <VitalGauge
                    icon={Activity} label="Blood Pressure"
                    value={effectiveRow.bp_sys}
                    unit={`/${effectiveRow.bp_dia}`} color="text-blue-400"
                    min={60} max={200} warning={160} critical={180}
                  />
                  <VitalGauge
                    icon={Droplets} label="SpO₂" value={effectiveRow.spo2}
                    unit="%" color="text-cyan-400" min={70} max={100}
                    warning={93} critical={88}
                  />
                  <VitalGauge
                    icon={Wind} label="Resp Rate" value={effectiveRow.resp_rate}
                    unit="/min" color="text-emerald-400" min={6} max={40}
                    warning={24} critical={30}
                  />
                </div>

                {/* Extra info bar */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    <Clock className="h-3 w-3 mr-1" />
                    {effectiveRow.timestamp.split("T")[1]?.substring(0, 8)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    MAP: {Math.round((effectiveRow.bp_sys + 2 * effectiveRow.bp_dia) / 3)}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] font-mono ${
                    effectiveRow.arrhythmia !== "Sinus rhythm" ? "border-amber-500/50 text-amber-400" : ""
                  }`}>
                    {effectiveRow.arrhythmia}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] font-mono ${
                    effectiveRow.signal_quality === "Poor" ? "border-red-500/50 text-red-400" :
                    effectiveRow.signal_quality === "Fair" ? "border-amber-500/50 text-amber-400" :
                    effectiveRow.signal_quality === "Good" ? "border-emerald-500/50 text-emerald-400" : ""
                  }`}>
                    Signal: {effectiveRow.signal_quality}
                  </Badge>
                  {!effectiveRow.finger && (
                    <Badge variant="outline" className="text-[10px] font-mono border-red-500/50 text-red-400 animate-pulse">
                      ⚠ NO FINGER
                    </Badge>
                  )}
                  {isPredicting && (
                    <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/50 text-cyan-400 animate-pulse">
                      <Activity className="h-3 w-3 mr-1 animate-spin" />
                      Running ML inference...
                    </Badge>
                  )}
                </div>

                {/* Prediction Timeline Table */}
                {predictions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                        Prediction Timeline ({predictions.length} assessments)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="overflow-x-auto max-h-48 overflow-y-auto">
                        <table className="w-full text-[10px] font-mono">
                          <thead>
                            <tr className="text-muted-foreground/60 border-b border-white/5">
                              <th className="text-left py-1 pr-2">#</th>
                              <th className="text-left py-1 pr-2">Time</th>
                              <th className="text-right py-1 pr-2">Risk</th>
                              <th className="text-right py-1 pr-2">LSTM</th>
                              <th className="text-right py-1 pr-2">Conf.</th>
                              <th className="text-left py-1 pr-2">Alert</th>
                              <th className="text-right py-1">Tripwires</th>
                            </tr>
                          </thead>
                          <tbody>
                            {predictions.map((p, i) => (
                              <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                                <td className="py-1 pr-2 text-muted-foreground">{i + 1}</td>
                                <td className="py-1 pr-2">{p.timestamp.split("T")[1]?.substring(0, 8)}</td>
                                <td className="py-1 pr-2 text-right font-bold">
                                  {(p.result.risk_score * 100).toFixed(1)}%
                                </td>
                                <td className="py-1 pr-2 text-right text-muted-foreground">
                                  {(p.result.lstm_score * 100).toFixed(1)}%
                                </td>
                                <td className="py-1 pr-2 text-right text-muted-foreground">
                                  {(p.result.confidence * 100).toFixed(0)}%
                                </td>
                                <td className="py-1 pr-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] border ${getAlertBadgeClass(p.result.alert_level)}`}>
                                    {p.result.alert_level}
                                  </span>
                                </td>
                                <td className="py-1 text-right">
                                  {p.result.n_active_tripwires > 0
                                    ? <span className="text-red-400">{p.result.n_active_tripwires}</span>
                                    : <span className="text-muted-foreground/40">0</span>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* ─── Right Panel: Latest Prediction + Risk Chart ─── */}
              <div className="space-y-4">
                {/* Risk Trend Chart */}
                <Card>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-cyan-400" /> Risk Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {predictions.length > 0 ? (
                      <MiniRiskChart predictions={predictions} />
                    ) : (
                      <div className="text-center py-4 text-[10px] text-muted-foreground">
                        Waiting for first prediction...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Latest Prediction */}
                <Card className={latestPrediction ? "border-l-2 " + (
                  latestPrediction.alert_level === "CRITICAL" || latestPrediction.alert_level === "FAST-TRACK"
                    ? "border-l-red-500"
                    : latestPrediction.alert_level === "AMBER"
                    ? "border-l-amber-500"
                    : "border-l-emerald-500"
                ) : ""}>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-primary" /> Latest Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {latestPrediction ? (
                      <div className="space-y-3">
                        {/* Alert level */}
                        <div className={`p-3 rounded-lg border bg-gradient-to-r ${getAlertColor(latestPrediction.alert_level)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">{latestPrediction.alert_level}</span>
                            {latestPrediction.fast_tracked && (
                              <Badge variant="destructive" className="animate-pulse text-[9px]">FAST-TRACKED</Badge>
                            )}
                          </div>
                        </div>

                        {/* Risk Score */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Risk Score</span>
                            <span className="font-mono font-bold">{(latestPrediction.risk_score * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={latestPrediction.risk_score * 100} className="h-2" />
                        </div>

                        {/* Confidence */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-mono">{(latestPrediction.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={latestPrediction.confidence * 100} className="h-1.5" />
                        </div>

                        {/* Conformal Interval */}
                        <div className="text-[10px] text-muted-foreground">
                          90% interval: [{(latestPrediction.conformal_interval[0] * 100).toFixed(1)}%, {(latestPrediction.conformal_interval[1] * 100).toFixed(1)}%]
                        </div>

                        {/* Active Tripwires */}
                        {latestPrediction.n_active_tripwires > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[10px] font-medium text-red-400">
                              <AlertCircle className="h-3 w-3" />
                              {latestPrediction.n_active_tripwires} Tripwire{latestPrediction.n_active_tripwires > 1 ? "s" : ""}
                            </div>
                            {latestPrediction.tripwires.filter(t => t.triggered).map((tw, i) => (
                              <div key={i} className="text-[9px] bg-red-500/10 p-1.5 rounded border border-red-500/20">
                                <span className="font-mono text-red-400">{tw.name}</span>
                                <span className="text-muted-foreground ml-1">— {tw.reason}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reasoning */}
                        <div className="text-[10px]">
                          <div className="font-medium text-muted-foreground mb-0.5">Clinical Reasoning</div>
                          <div className="text-muted-foreground/80 leading-relaxed">{latestPrediction.reasoning}</div>
                        </div>

                        {/* Actions */}
                        {latestPrediction.actions.length > 0 && (
                          <div className="text-[10px]">
                            <div className="font-medium text-muted-foreground mb-0.5">Actions</div>
                            <ul className="space-y-0.5">
                              {latestPrediction.actions.map((a, i) => (
                                <li key={i} className="flex items-start gap-1 text-muted-foreground/80">
                                  <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-cyan-400" />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Clinical Narrative */}
                        {latestPrediction.clinical_narrative && (
                          <div className="text-[10px] p-2 rounded bg-purple-500/5 border border-purple-500/20">
                            <div className="font-medium text-purple-400 mb-0.5">AI Narrative</div>
                            <div className="text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">
                              {latestPrediction.clinical_narrative}
                            </div>
                          </div>
                        )}

                        <div className="text-[9px] text-muted-foreground/50 font-mono border-t border-white/5 pt-1">
                          Backend: {latestPrediction.backend}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground/50">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-[10px]">Awaiting first prediction...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Constant vitals summary */}
                <Card>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                      <Thermometer className="h-3.5 w-3.5" /> Fixed Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-muted-foreground">Temp</span><span>{constants.temperature}°C</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">GCS</span><span>{constants.gcs_total}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Lactate</span><span>{constants.lactate}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">WBC</span><span>{constants.wbc}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Creatinine</span><span>{constants.creatinine}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Platelets</span><span>{constants.platelets}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{constants.age}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span>{constants.gender}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Finished banner */}
            {phase === "finished" && (
              <Card className="border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Activity className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Session Complete</h3>
                      <p className="text-xs text-muted-foreground">
                        {csvData.length} data points processed • {predictions.length} predictions made
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleStop}>
                      Replay
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setPhase("upload");
                      setCsvData([]);
                      setPredictions([]);
                      setLatestPrediction(null);
                    }}>
                      New Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
