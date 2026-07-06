import { useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { usePatients } from "@/hooks/usePatients";
import { usePatientVitals } from "@/hooks/usePatientVitals";
import { useRiskAssessments } from "@/hooks/useRiskAssessments";
import { useTripwireAlerts } from "@/hooks/useTripwireAlerts";
import { usePatientLabs } from "@/hooks/usePatientLabs";
import { PatientTopBar } from "@/components/patient/PatientTopBar";
import { VitalsPanel } from "@/components/patient/VitalsPanel";
import { VitalsChart } from "@/components/patient/VitalsChart";
import { LabsPanel } from "@/components/patient/LabsPanel";
import { RiskGauge } from "@/components/patient/RiskGauge";
import { ConfidenceInterval } from "@/components/patient/ConfidenceInterval";
import { HITLActionPanel } from "@/components/patient/HITLActionPanel";
import { TripwirePanel } from "@/components/patient/TripwirePanel";
import { LogVitalsDrawer } from "@/components/patient/LogVitalsDrawer";
import { LogLabsDrawer } from "@/components/patient/LogLabsDrawer";
import { DischargePatientDialog } from "@/components/patient/DischargePatientDialog";
import { ClinicalChat } from "@/components/patient/ClinicalChat";
import { VitalsOverridePanel, type VitalsOverride } from "@/components/patient/VitalsOverridePanel";
import { predict } from "@/lib/demoEngine";
import { CXRUploadPanel } from "@/components/patient/CXRUploadPanel";
import type { RiskTier, MentalStatus } from "@/types/database";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: patients } = usePatients();
  const { data: vitals } = usePatientVitals(id);
  const { data: assessments } = useRiskAssessments(id);
  const { data: alerts } = useTripwireAlerts(id);
  const { data: lab } = usePatientLabs(id);

  const patient = patients?.find((p) => p.id === id);
  const latestVital = vitals?.[vitals.length - 1];
  const latestRiskDB = assessments?.[assessments.length - 1];

  // Slider-driven vitals state
  const [overrideVitals, setOverrideVitals] = useState<VitalsOverride | null>(null);

  const handleVitalsChange = useCallback((v: VitalsOverride) => {
    setOverrideVitals(v);
  }, []);

  // Initial vitals from DB for slider defaults
  const initialVitals = {
    heart_rate: latestVital?.heart_rate ?? undefined,
    map: latestVital?.map ?? undefined,
    temperature: latestVital?.temperature ?? undefined,
    resp_rate: latestVital?.respiratory_rate ?? undefined,
    spo2: latestVital?.spo2 ?? undefined,
    lactate: lab?.lactate ?? undefined,
    wbc: lab?.wbc ?? undefined,
    creatinine: lab?.creatinine ?? undefined,
    platelets: lab?.platelets ?? undefined,
  };

  // Compute LIVE risk score from slider values using demoEngine
  const liveResult = useMemo(() => {
    if (!overrideVitals) return null;
    return predict(overrideVitals);
  }, [overrideVitals]);

  // Use live computed risk or fall back to DB
  const effectiveRisk = liveResult
    ? {
        quantum_risk_score: liveResult.risk_score,
        confidence_interval_lower: liveResult.conformal_interval[0],
        confidence_interval_upper: liveResult.conformal_interval[1],
        tier: liveResult.alert_level as RiskTier,
        lstm_score: liveResult.lstm_score,
        xgb_score: liveResult.xgb_score,
        timestamp: new Date().toISOString(),
      }
    : latestRiskDB;

  const tier = (effectiveRisk?.tier as RiskTier) ?? "WATCH";

  // Tripwires: use live or DB
  const liveTripwires = liveResult?.tripwires.filter((t) => t.triggered) ?? [];
  const mentalStatus = (latestVital?.mental_status as MentalStatus) ?? "normal";
  const isAlteredMental = mentalStatus !== "normal";
  const totalTripwires = liveResult
    ? liveResult.n_active_tripwires + (isAlteredMental ? 1 : 0)
    : (alerts?.length ?? 0) + (isAlteredMental ? 1 : 0);
  const isCriticalOverride = totalTripwires >= 2;

  // Build chat context from slider values
  const v = overrideVitals;
  const chatContext = {
    name: patient?.name,
    heart_rate: v?.heart_rate ?? latestVital?.heart_rate ?? 75,
    map: v?.map ?? latestVital?.map ?? 85,
    temperature: v?.temperature ?? latestVital?.temperature ?? 37,
    resp_rate: v?.resp_rate ?? latestVital?.respiratory_rate ?? 14,
    spo2: v?.spo2 ?? latestVital?.spo2 ?? 98,
    gcs_total: v?.gcs_total ?? 15,
    lactate: v?.lactate ?? lab?.lactate ?? 1.0,
    wbc: v?.wbc ?? lab?.wbc ?? 8.0,
    creatinine: v?.creatinine ?? lab?.creatinine ?? 0.9,
    platelets: v?.platelets ?? lab?.platelets ?? 220,
    age: v?.age ?? 55,
    gender: v?.gender ?? ("M" as const),
    risk_score: liveResult?.risk_score ?? latestRiskDB?.quantum_risk_score ?? 0,
    conf_lower: liveResult?.conformal_interval[0] ?? latestRiskDB?.confidence_interval_lower ?? 0,
    conf_upper: liveResult?.conformal_interval[1] ?? latestRiskDB?.confidence_interval_upper ?? 0,
    alert_level: tier,
    active_tripwires: liveResult
      ? liveTripwires.map((t) => t.name)
      : alerts?.map((a: any) => a.metric) ?? [],
  };

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground font-mono">Loading patient data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />
      <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PatientTopBar patient={patient} tier={tier} isCriticalOverride={isCriticalOverride} />
        <div className="flex items-center gap-2 shrink-0">
          {/* HITL: Manual data entry points */}
          <LogVitalsDrawer patientId={patient.id} />
          <LogLabsDrawer patientId={patient.id} />
          <DischargePatientDialog patientId={patient.id} patientName={patient.name} />
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Slider-based Vitals/Labs Input */}
          <div className="lg:col-span-3 space-y-4">
            <VitalsOverridePanel
              initialVitals={initialVitals}
              onVitalsChange={handleVitalsChange}
            />
          </div>

          {/* Center Column: DB Vitals & Charts */}
          <div className="lg:col-span-5 space-y-4">
            <VitalsPanel latestVital={latestVital} />
            <VitalsChart vitals={vitals ?? []} />
            <LabsPanel lab={lab} />
          </div>

          {/* Right Column: Live Risk (from sliders) + HITL Actions */}
          <div className="lg:col-span-4 space-y-4">
            <RiskGauge assessment={effectiveRisk as any} />
            <ConfidenceInterval assessment={effectiveRisk as any} />

            {/* Live tripwires from slider prediction */}
            {liveResult && liveResult.n_active_tripwires > 0 && (
              <div className="rounded-lg border border-red-500/30 bg-red-950/10 p-3 space-y-2">
                <p className="text-xs font-mono text-red-400 uppercase tracking-wider">
                  ⚠ Live Tripwires ({liveResult.n_active_tripwires} active)
                  {liveResult.has_extreme && <span className="ml-2 text-red-300 font-bold">EXTREME</span>}
                </p>
                {liveResult.tripwires
                  .filter((t) => t.triggered)
                  .map((tw) => (
                    <div key={tw.name} className="flex justify-between text-xs font-mono text-red-300">
                      <span>{tw.name}</span>
                      <span>{tw.value.toFixed(1)} — {tw.reason}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Live recommended actions */}
            {liveResult && (
              <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Recommended Actions
                </p>
                {liveResult.actions.map((a, i) => (
                  <p key={i} className="text-xs font-mono text-foreground">{a}</p>
                ))}
                <p className="text-[10px] text-muted-foreground italic mt-1">{liveResult.reasoning}</p>
              </div>
            )}

            {/* HITL Actions */}
            <HITLActionPanel
              tier={tier}
              isCriticalOverride={isCriticalOverride}
              patientName={patient.name}
            />
            <TripwirePanel alerts={alerts ?? []} latestVital={latestVital} />
            <CXRUploadPanel />
          </div>
        </div>
      </div>

      {/* Clinical AI Chat - floating bubble */}
      <ClinicalChat patientContext={chatContext} />
    </div>
  );
};

export default PatientDetail;
