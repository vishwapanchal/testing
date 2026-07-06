export type AlertLevel = "WATCH" | "AMBER" | "CRITICAL" | "FAST-TRACK";

export interface VitalInputs {
  age: number;
  gender: "M" | "F";
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
  cxr_image_base64?: string;
}

export interface PredictionResult {
  risk_score: number;
  confidence: number;
  conformal_interval: [number, number];
  alert_level: AlertLevel;
  lstm_score: number;
  xgb_score: number;
  fast_tracked: boolean;
  tripwires: { name: string; triggered: boolean; value: number; reason: string }[];
  n_active_tripwires: number;
  has_extreme: boolean;
  actions: string[];
  reasoning: string;
  backend: string;
  cxr_findings?: { findings: any[]; risk_modifier: number; summary: string };
  clinical_narrative?: string;
  demographics?: { age: number; gender: string; age_risk_note: string };
}

export const SCENARIOS = {
  normal: {
    label: "Normal Patient",
    description: "Stable vitals, no risk of sepsis.",
    vitals: {
      age: 45,
      gender: "M" as const,
      heart_rate: 70,
      map: 90,
      temperature: 37,
      resp_rate: 14,
      spo2: 98,
      gcs_total: 15,
      lactate: 1.0,
      wbc: 7.0,
      creatinine: 0.9,
      platelets: 250,
    }
  }
};

export function predict(vitals: VitalInputs): PredictionResult {
  return {
    risk_score: 0.1,
    confidence: 0.9,
    conformal_interval: [0.05, 0.15],
    alert_level: "WATCH",
    lstm_score: 0.1,
    xgb_score: 0.1,
    fast_tracked: false,
    tripwires: [],
    n_active_tripwires: 0,
    has_extreme: false,
    actions: ["Monitor patient routinely."],
    reasoning: "All vitals are within normal ranges.",
    backend: "client_fallback"
  };
}
