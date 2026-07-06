import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Upload, FileImage, Loader2, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Stethoscope,
} from "lucide-react";

interface CXRFinding {
  finding: string;
  probability: number;
  severity: string;
  sepsis_relevant: boolean;
}

interface CXRResult {
  pulmonary_infection_risk: number;
  top_findings: CXRFinding[];
  interpretation: string;
  sepsis_relevant_findings: Record<string, number>;
  model: string;
  error?: string;
}

export function CXRUploadPanel() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<CXRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload & analyze
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/analyze-xray", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (risk: number) => {
    if (risk > 0.5) return "text-red-400";
    if (risk > 0.3) return "text-amber-400";
    return "text-emerald-400";
  };

  const severityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-500/20 text-red-300 border-red-500/30",
      medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      low: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    };
    return colors[severity] || colors.low;
  };

  return (
    <Card className="border-blue-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <FileImage className="h-4 w-4 text-blue-400" />
          Chest X-Ray Analysis
          <Badge variant="outline" className="text-[9px] border-blue-500/40 text-blue-400 ml-auto">
            TorchXRayVision
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Upload area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
            "hover:border-blue-500/50 hover:bg-blue-500/5",
            image ? "border-blue-500/30" : "border-border"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {image ? (
            <div className="space-y-2">
              <img
                src={image}
                alt="Chest X-Ray"
                className="max-h-36 mx-auto rounded-md object-contain opacity-90"
              />
              <p className="text-[10px] text-muted-foreground font-mono">{fileName}</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                Upload Chest X-Ray (JPEG/PNG)
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                DenseNet-121 analyzes 18 pathologies
              </p>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-xs text-blue-300 font-mono">Analyzing X-ray with DenseNet-121...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-red-300">{error}</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            {/* Pulmonary Infection Risk */}
            <div className="p-3 rounded-lg bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Pulmonary Infection Risk
                </span>
                <span className={cn("text-lg font-mono font-bold", riskColor(result.pulmonary_infection_risk))}>
                  {(result.pulmonary_infection_risk * 100).toFixed(1)}%
                </span>
              </div>
              {/* Risk bar */}
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    result.pulmonary_infection_risk > 0.5 ? "bg-red-500" :
                    result.pulmonary_infection_risk > 0.3 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(result.pulmonary_infection_risk * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Sepsis-Relevant Findings */}
            <div className="p-3 rounded-lg bg-card border border-border space-y-2">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Sepsis-Relevant Findings
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(result.sepsis_relevant_findings).map(([name, score]) => (
                  <div key={name} className="flex items-center justify-between text-xs font-mono">
                    <span className={cn(
                      score > 0.5 ? "text-red-300" : score > 0.3 ? "text-amber-300" : "text-muted-foreground"
                    )}>
                      {name}
                    </span>
                    <span className={cn(
                      "font-bold",
                      score > 0.5 ? "text-red-400" : score > 0.3 ? "text-amber-400" : "text-muted-foreground"
                    )}>
                      {(score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interpretation */}
            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-2">
                <Stethoscope className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-foreground leading-relaxed">{result.interpretation}</p>
              </div>
            </div>

            {/* Expandable: All Findings */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {expanded ? "Hide" : "Show"} All 18 Pathology Scores
            </Button>
            {expanded && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.top_findings.map((f) => (
                  <div key={f.finding} className="flex items-center justify-between text-xs font-mono px-1">
                    <div className="flex items-center gap-1.5">
                      <span className={f.sepsis_relevant ? "text-blue-300" : "text-muted-foreground"}>
                        {f.finding}
                      </span>
                      {f.sepsis_relevant && (
                        <span className="text-[8px] text-blue-500">[SEPSIS]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={cn("text-[8px] h-4 px-1", severityBadge(f.severity))}>
                        {f.severity}
                      </Badge>
                      <span className={cn(
                        "w-10 text-right font-bold",
                        f.probability > 0.5 ? "text-red-400" : f.probability > 0.3 ? "text-amber-400" : "text-muted-foreground"
                      )}>
                        {(f.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload another */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              Analyze Another X-Ray
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
