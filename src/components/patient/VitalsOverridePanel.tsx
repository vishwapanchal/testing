import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Heart, Thermometer, Wind, Droplets, Brain, Zap,
  Activity, SlidersHorizontal, RotateCcw,
} from "lucide-react";

export interface VitalsOverride {
  heart_rate: number;
  map: number;
  temperature: number;
  resp_rate: number;
  spo2: number;
  gcs_total: number;
  lactate: number;
  wbc: number;
  creatinine: number;
  platelets: number;
  age: number;
  gender: "M" | "F";
}

interface VitalsOverridePanelProps {
  initialVitals?: Partial<VitalsOverride>;
  onVitalsChange: (vitals: VitalsOverride) => void;
}

const DEFAULT_VITALS: VitalsOverride = {
  heart_rate: 75,
  map: 85,
  temperature: 37.0,
  resp_rate: 14,
  spo2: 98,
  gcs_total: 15,
  lactate: 1.0,
  wbc: 8.0,
  creatinine: 0.9,
  platelets: 220,
  age: 55,
  gender: "M",
};

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

export function VitalsOverridePanel({ initialVitals, onVitalsChange }: VitalsOverridePanelProps) {
  const [enabled, setEnabled] = useState(true);
  const [vitals, setVitals] = useState<VitalsOverride>(() => ({
    ...DEFAULT_VITALS,
    ...Object.fromEntries(
      Object.entries(initialVitals || {}).filter(([_, v]) => v != null)
    ),
  }));

  useEffect(() => {
    if (enabled) {
      onVitalsChange(vitals);
    }
  }, [vitals, enabled, onVitalsChange]);

  // Sync with new patient data when initialVitals change
  useEffect(() => {
    if (initialVitals) {
      setVitals(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(initialVitals).filter(([_, v]) => v != null)
        ),
      }));
    }
  }, [initialVitals?.heart_rate, initialVitals?.map]);

  const updateVital = (key: keyof VitalsOverride, val: number) => {
    setVitals(prev => ({ ...prev, [key]: val }));
  };

  const reset = () => {
    setVitals({
      ...DEFAULT_VITALS,
      ...Object.fromEntries(
        Object.entries(initialVitals || {}).filter(([_, v]) => v != null)
      ),
    });
  };

  return (
    <Card className="border-cyan-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Vital Signs & Labs Input
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={reset}>
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
            <div className="flex items-center gap-1.5">
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                className="scale-75"
              />
              <Label className="text-[10px] text-muted-foreground">
                {enabled ? "Live" : "Paused"}
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
          <VitalSlider icon={<Activity className="h-3 w-3" />} label="Age" unit="yrs" value={vitals.age} min={18} max={100} step={1} onChange={(v) => updateVital("age", v)} />
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
              <Activity className="h-3 w-3" /> Gender
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={vitals.gender === "M" ? "default" : "outline"}
                onClick={() => setVitals(prev => ({ ...prev, gender: "M" }))}
                className="text-xs px-3 h-7"
              >Male</Button>
              <Button size="sm" variant={vitals.gender === "F" ? "default" : "outline"}
                onClick={() => setVitals(prev => ({ ...prev, gender: "F" }))}
                className="text-xs px-3 h-7"
              >Female</Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-2" />

        {/* Vital Signs */}
        <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Vital Signs</p>
        <VitalSlider icon={<Heart className="h-3 w-3" />} label="Heart Rate" unit="bpm" value={vitals.heart_rate} min={30} max={200} step={1} onChange={(v) => updateVital("heart_rate", v)} />
        <VitalSlider icon={<Droplets className="h-3 w-3" />} label="MAP" unit="mmHg" value={vitals.map} min={30} max={140} step={1} onChange={(v) => updateVital("map", v)} />
        <VitalSlider icon={<Thermometer className="h-3 w-3" />} label="Temperature" unit="°C" value={vitals.temperature} min={33} max={42} step={0.1} onChange={(v) => updateVital("temperature", v)} />
        <VitalSlider icon={<Wind className="h-3 w-3" />} label="Resp Rate" unit="br/min" value={vitals.resp_rate} min={5} max={45} step={1} onChange={(v) => updateVital("resp_rate", v)} />
        <VitalSlider icon={<Droplets className="h-3 w-3" />} label="SpO₂" unit="%" value={vitals.spo2} min={70} max={100} step={1} onChange={(v) => updateVital("spo2", v)} />
        <VitalSlider icon={<Brain className="h-3 w-3" />} label="GCS" unit="" value={vitals.gcs_total} min={3} max={15} step={1} onChange={(v) => updateVital("gcs_total", v)} />

        <div className="border-t border-border pt-2" />

        {/* Labs */}
        <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Laboratory Values</p>
        <VitalSlider icon={<Zap className="h-3 w-3" />} label="Lactate" unit="mmol/L" value={vitals.lactate} min={0.5} max={15} step={0.1} onChange={(v) => updateVital("lactate", v)} />
        <VitalSlider icon={<Activity className="h-3 w-3" />} label="WBC" unit="K/µL" value={vitals.wbc} min={0.5} max={40} step={0.5} onChange={(v) => updateVital("wbc", v)} />
        <VitalSlider icon={<Activity className="h-3 w-3" />} label="Creatinine" unit="mg/dL" value={vitals.creatinine} min={0.3} max={8} step={0.1} onChange={(v) => updateVital("creatinine", v)} />
        <VitalSlider icon={<Activity className="h-3 w-3" />} label="Platelets" unit="K/µL" value={vitals.platelets} min={10} max={400} step={5} onChange={(v) => updateVital("platelets", v)} />
      </CardContent>
    </Card>
  );
}
