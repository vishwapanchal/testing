import { usePatients } from "@/hooks/usePatients";
import { useLatestRiskForPatients } from "@/hooks/useRiskAssessments";
import { PatientCard } from "@/components/ward/PatientCard";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { TIER_ORDER } from "@/types/database";
import type { RiskTier, RiskAssessment } from "@/types/database";
import { Shield, Activity } from "lucide-react";
import { AdmitPatientModal } from "@/components/ward/AdmitPatientModal";
import { PipelineActivityCompact } from "@/components/observability/PipelineActivityFeed";
import { useHospital } from "@/contexts/HospitalContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TripwireAlert } from "@/types/database";
import { motion } from "framer-motion";

const Index = () => {
  const { data: patients, isLoading } = usePatients();
  const { connectionStatus } = useHospital();
  const patientIds = patients?.map((p) => p.id) ?? [];
  const { data: allRisks } = useLatestRiskForPatients(patientIds);

  // Fetch active tripwire counts for all patients
  const { data: allTripwires } = useQuery({
    queryKey: ["all_tripwires", patientIds],
    enabled: patientIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tripwire_alerts")
        .select("*")
        .in("patient_id", patientIds)
        .eq("is_active", true);
      if (error) throw error;
      return data as TripwireAlert[];
    },
    refetchInterval: 15000,
  });

  let displayPatients = patients;
  let displayRisks = allRisks;
  let displayTripwires = allTripwires;

  // Add dummy data for visual testing if no real patients exist
  if (!isLoading && (!patients || patients.length === 0)) {
    displayPatients = [
      {
        id: "d1",
        first_name: "James",
        last_name: "Wilson",
        mrn: "MRN-1001",
        date_of_birth: "1960-05-15",
        gender: "Male",
        ward: "ICU-A",
        room: "101",
        bed: "A",
        admission_time: new Date(Date.now() - 48*3600000).toISOString(),
        primary_diagnosis: "Severe Sepsis",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "d2",
        first_name: "Sarah",
        last_name: "Connor",
        mrn: "MRN-1002",
        date_of_birth: "1975-08-22",
        gender: "Female",
        ward: "ICU-B",
        room: "205",
        bed: "B",
        admission_time: new Date(Date.now() - 24*3600000).toISOString(),
        primary_diagnosis: "Post-op Infection",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "d3",
        first_name: "Michael",
        last_name: "Chen",
        mrn: "MRN-1003",
        date_of_birth: "1982-11-03",
        gender: "Male",
        ward: "ICU-A",
        room: "102",
        bed: "A",
        admission_time: new Date(Date.now() - 12*3600000).toISOString(),
        primary_diagnosis: "Trauma Observation",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    displayRisks = [
      {
        id: "r1",
        patient_id: "d1",
        timestamp: new Date().toISOString(),
        tier: "CRITICAL",
        score: 85,
        clinical_context: { reason: "High lactate and sustained hypotension" },
        contributing_factors: ["Hypotension", "Lactate > 2.0", "Tachycardia"],
        vital_signs_snapshot: { heart_rate: 110, blood_pressure: "90/60" },
        lab_results_snapshot: { lactate: 3.5 },
        created_at: new Date().toISOString()
      },
      {
        id: "r2",
        patient_id: "d2",
        timestamp: new Date().toISOString(),
        tier: "WARNING",
        score: 55,
        clinical_context: { reason: "Rising temperature" },
        contributing_factors: ["Temperature > 38", "Elevated WBC"],
        vital_signs_snapshot: { heart_rate: 95, temperature: 38.5 },
        lab_results_snapshot: {},
        created_at: new Date().toISOString()
      },
      {
        id: "r3",
        patient_id: "d3",
        timestamp: new Date().toISOString(),
        tier: "WATCH",
        score: 15,
        clinical_context: { reason: "Stable" },
        contributing_factors: [],
        vital_signs_snapshot: { heart_rate: 70 },
        lab_results_snapshot: {},
        created_at: new Date().toISOString()
      }
    ];

    displayTripwires = [];
  }

  // Group risks by patient
  const risksByPatient: Record<string, RiskAssessment[]> = {};
  const latestRiskByPatient: Record<string, RiskAssessment> = {};
  displayRisks?.forEach((r) => {
    if (!risksByPatient[r.patient_id]) risksByPatient[r.patient_id] = [];
    risksByPatient[r.patient_id].push(r);
    const existing = latestRiskByPatient[r.patient_id];
    if (!existing || r.timestamp > existing.timestamp) {
      latestRiskByPatient[r.patient_id] = r;
    }
  });

  // Tripwire count by patient
  const tripwireCountByPatient: Record<string, number> = {};
  displayTripwires?.forEach((t) => {
    tripwireCountByPatient[t.patient_id] = (tripwireCountByPatient[t.patient_id] || 0) + 1;
  });

  // Sort patients by tier priority
  const sortedPatients = [...(displayPatients ?? [])].sort((a, b) => {
    const tierA = (latestRiskByPatient[a.id]?.tier as RiskTier) ?? "WATCH";
    const tierB = (latestRiskByPatient[b.id]?.tier as RiskTier) ?? "WATCH";
    const overrideA = (tripwireCountByPatient[a.id] ?? 0) >= 2;
    const overrideB = (tripwireCountByPatient[b.id] ?? 0) >= 2;
    const effectiveA = overrideA ? "CRITICAL" : tierA;
    const effectiveB = overrideB ? "CRITICAL" : tierB;
    return TIER_ORDER[effectiveA] - TIER_ORDER[effectiveB];
  });

  const criticalCount = sortedPatients.filter((p) => {
    const tier = (latestRiskByPatient[p.id]?.tier as RiskTier) ?? "WATCH";
    const override = (tripwireCountByPatient[p.id] ?? 0) >= 2;
    return tier === "CRITICAL" || override;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans text-slate-900 selection:bg-blue-100">
      <div className="relative z-10 flex flex-col min-h-screen">
        <GlobalNav />

        {/* Status Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-8 py-4 sticky top-0 z-40"
        >
          <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto flex-wrap">
            <div className="flex items-center gap-6">
              <h1 className="font-sora text-2xl font-bold text-slate-900 tracking-tight hidden md:block">
                ICU Command Center
              </h1>
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 text-sm font-semibold text-slate-700 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
              >
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </div>
                <span>{displayPatients?.length ?? 0} Active Patients</span>
              </motion.div>
            </div>
            
            <div className="flex items-center gap-4">
              {criticalCount > 0 && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-red-50 border border-red-100 shadow-sm"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold tracking-widest text-red-700 uppercase">
                    {criticalCount} Critical
                  </span>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <AdmitPatientModal />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Patient Grid */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-40">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-blue-400 animate-spin" style={{ animationDuration: '2s' }} />
                      <div className="absolute inset-3 rounded-full border-r-2 border-b-2 border-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                      <div className="absolute inset-6 rounded-full border-t-2 border-indigo-300 animate-spin" style={{ animationDuration: '3s' }} />
                      <Activity className="h-7 w-7 text-blue-500 animate-pulse" />
                    </div>
                    <p className="text-slate-500 font-semibold tracking-[0.2em] uppercase text-xs">Synchronizing Ward Data...</p>
                  </motion.div>
                </div>
              ) : sortedPatients.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center py-32 space-y-6 bg-white border border-slate-200 rounded-[2rem] shadow-xl relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-slate-50 animate-ping" style={{ animationDuration: '3s' }} />
                    <Shield className="h-10 w-10 text-slate-400 group-hover:text-blue-500 transition-colors duration-500" />
                  </motion.div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="font-sora text-2xl font-bold text-slate-900">No Active Patients</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed text-sm">
                      The ICU ward is currently empty. The system is standing by for patient admission or pipeline data synchronization.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial="hidden" animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {sortedPatients.map((patient) => (
                    <motion.div 
                      key={patient.id} 
                      variants={{ hidden: { opacity: 0, y: 30, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } } }}
                    >
                      <PatientCard
                        patient={patient}
                        latestRisk={latestRiskByPatient[patient.id]}
                        riskHistory={risksByPatient[patient.id] ?? []}
                        activeTripwireCount={tripwireCountByPatient[patient.id] ?? 0}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Observability: Live Pipeline Feed sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-1"
            >
              <div className="sticky top-28 space-y-5">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-200 text-blue-500">
                      <Activity className="h-4 w-4" />
                    </div>
                    <h3 className="font-sora font-semibold text-slate-900 tracking-wide uppercase text-sm">
                      Live Telemetry
                    </h3>
                  </div>
                  <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 shadow-xl rounded-[2rem] overflow-hidden relative group transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="relative z-10 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar p-1">
                    <PipelineActivityCompact />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
