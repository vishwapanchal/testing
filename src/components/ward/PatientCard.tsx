import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { TierBadge } from "@/components/shared/TierBadge";
import { RiskSparkline } from "./RiskSparkline";
import { cn } from "@/lib/utils";
import type { Patient, RiskAssessment, RiskTier } from "@/types/database";
import { Activity } from "lucide-react";

interface PatientCardProps {
  patient: Patient;
  latestRisk?: RiskAssessment;
  riskHistory: RiskAssessment[];
  activeTripwireCount: number;
}

export function PatientCard({ patient, latestRisk, riskHistory, activeTripwireCount }: PatientCardProps) {
  const navigate = useNavigate();
  const tier = (latestRisk?.tier as RiskTier) || "WATCH";
  const score = latestRisk?.quantum_risk_score;
  const isCriticalOverride = activeTripwireCount >= 2;

  const borderClasses = {
    CRITICAL: "border-red-200",
    AMBER: "border-orange-200",
    WATCH: "border-slate-200",
  };

  return (
    <Card
      onClick={() => navigate(`/patient/${patient.id}`)}
      className={cn(
        "cursor-pointer transition-all duration-300 bg-white border shadow-sm group hover:-translate-y-1 hover:shadow-xl rounded-[1.5rem] overflow-hidden",
        borderClasses[isCriticalOverride ? "CRITICAL" : tier],
        isCriticalOverride && "ring-1 ring-red-400 animate-pulse-critical"
      )}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-sora font-bold text-slate-900 text-lg mb-0.5 truncate" title={patient.name}>{patient.name}</h3>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wider flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md whitespace-nowrap">Bed {patient.bed_number}</span>
              <span className="truncate">MRN: {patient.mrn}</span>
            </div>
          </div>
          <div className="shrink-0">
            <TierBadge tier={isCriticalOverride ? "CRITICAL" : tier} size="sm" />
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantum Risk Trend</span>
            {score !== undefined && (
              <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                {score.toFixed(2)}
              </span>
            )}
          </div>
          <div className="h-12 w-full bg-slate-50 rounded-lg p-1.5 border border-slate-100 overflow-hidden">
            <RiskSparkline assessments={riskHistory} tier={tier} />
          </div>
        </div>

        {isCriticalOverride && (
          <div className="mt-2 flex items-center justify-center gap-2 bg-red-50 border border-red-200 py-2 px-3 rounded-xl">
            <Activity className="w-3.5 h-3.5 text-red-600 animate-bounce" />
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">
              {activeTripwireCount} Tripwires — Critical Override
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
