import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
};

const glassClasses = "rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden transition-all duration-300 hover:border-slate-300 hover:shadow-2xl relative";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-mono uppercase tracking-widest text-sm">Loading Data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden text-slate-900">
      <div className="relative z-10">
        <GlobalNav />
        
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 mt-4">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-900 mb-4 font-medium pl-0" onClick={() => navigate(-1)}>
            &larr; Back to Dashboard
          </Button>
        </div>
        
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="p-4 md:p-6 lg:p-8 pt-0 space-y-6 max-w-[1800px] mx-auto"
        >
          <motion.div 
            variants={itemVariants} 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none" />
            <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
              <div className="flex-1 min-w-0 w-full">
                <PatientTopBar patient={patient} tier={tier} isCriticalOverride={isCriticalOverride} />
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <LogVitalsDrawer patientId={patient.id} />
                <LogLabsDrawer patientId={patient.id} />
                <DischargePatientDialog patientId={patient.id} patientName={patient.name} />
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bento-grid">
            {/* Left Column: Slider-based Vitals/Labs Input */}
            <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6 flex flex-col min-w-0">
              <div className={`${glassClasses} h-full p-1 min-w-0 overflow-x-hidden`}>
                <VitalsOverridePanel
                  initialVitals={initialVitals}
                  onVitalsChange={handleVitalsChange}
                />
              </div>
            </motion.div>

            {/* Center Column: DB Vitals & Charts */}
            <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6 flex flex-col min-w-0">
              <div className={`${glassClasses} p-1 min-w-0 overflow-x-hidden`}>
                <VitalsPanel latestVital={latestVital} />
              </div>
              <div className={`${glassClasses} flex-1 p-1 min-h-[300px] min-w-0 overflow-x-hidden`}>
                <VitalsChart vitals={vitals ?? []} />
              </div>
              <div className={`${glassClasses} p-1 min-w-0 overflow-x-hidden`}>
                <LabsPanel lab={lab} />
              </div>
            </motion.div>

            {/* Right Column: Live Risk + HITL Actions */}
            <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6 flex flex-col min-w-0">
              <div className={`${glassClasses} min-w-0 overflow-x-hidden`}>
                <RiskGauge assessment={effectiveRisk as any} />
              </div>
              <div className={`${glassClasses} min-w-0 overflow-x-hidden`}>
                <ConfidenceInterval assessment={effectiveRisk as any} />
              </div>

              {/* Live tripwires from slider prediction */}
              <AnimatePresence mode="popLayout">
                {liveResult && liveResult.n_active_tripwires > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                    <p className="text-sm font-semibold font-mono text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                      </span>
                      Live Tripwires ({liveResult.n_active_tripwires} active)
                      {liveResult.has_extreme && <span className="ml-auto text-white font-bold bg-red-600 px-2 py-0.5 rounded shadow-lg">EXTREME</span>}
                    </p>
                    <div className="space-y-2 relative z-10">
                      {liveResult.tripwires
                        .filter((t) => t.triggered)
                        .map((tw, idx) => (
                          <motion.div 
                            key={tw.name}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex justify-between items-start gap-2 text-xs font-mono text-red-900 bg-white p-2.5 rounded-lg border border-red-100 shadow-sm min-w-0"
                          >
                            <span className="font-semibold break-words flex-1 min-w-0">{tw.name}</span>
                            <span className="opacity-80 text-right shrink-0 max-w-[50%] break-words">{tw.value.toFixed(1)} — {tw.reason}</span>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live recommended actions */}
              <AnimatePresence mode="popLayout">
                {liveResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                    <p className="text-xs font-semibold font-mono text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Recommended Actions
                    </p>
                    <div className="space-y-2 relative z-10">
                      {liveResult.actions.map((a, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="text-xs font-mono text-blue-900 flex items-start gap-2 bg-white p-2.5 rounded border border-blue-100 shadow-sm min-w-0"
                        >
                          <span className="text-blue-600 mt-0.5 shrink-0">▸</span> <span className="break-words flex-1 min-w-0">{a}</span>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-[10px] text-blue-600/70 italic mt-4 border-t border-blue-200 pt-3">{liveResult.reasoning}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`${glassClasses} min-w-0 overflow-x-hidden`}>
                <HITLActionPanel
                  tier={tier}
                  isCriticalOverride={isCriticalOverride}
                  patientName={patient.name}
                />
              </div>
              <div className={`${glassClasses} min-w-0 overflow-x-hidden`}>
                <TripwirePanel alerts={alerts ?? []} latestVital={latestVital} />
              </div>
              <div className={`${glassClasses} min-w-0 overflow-x-hidden`}>
                <CXRUploadPanel />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Clinical AI Chat - floating bubble */}
      <ClinicalChat patientContext={chatContext} />
    </div>
  );
};

export default PatientDetail;
