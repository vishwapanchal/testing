import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MessageCircle, Send, Bot, User, Stethoscope,
  ChevronRight, ChevronLeft, Loader2, Sparkles,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: string;
  timestamp: Date;
}

interface PatientContext {
  name?: string;
  heart_rate?: number;
  map?: number;
  temperature?: number;
  resp_rate?: number;
  spo2?: number;
  gcs_total?: number;
  lactate?: number;
  wbc?: number;
  creatinine?: number;
  platelets?: number;
  age?: number;
  gender?: string;
  risk_score?: number;
  conf_lower?: number;
  conf_upper?: number;
  alert_level?: string;
  active_tripwires?: string[];
}

interface ClinicalChatProps {
  patientContext: PatientContext;
}

const QUICK_QUERIES = [
  "Should I start antibiotics?",
  "What is the risk trend?",
  "Is vasopressor needed?",
  "Can we consider step-down?",
  "Fluid resuscitation plan?",
];

export function ClinicalChat({ patientContext }: ClinicalChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Clinical AI ready for ${patientContext.name || "this patient"}. Ask me about vitals, treatment decisions, or risk assessment.`,
      source: "system",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: query.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          patient_context: patientContext,
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          source: data.source,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      // Client-side fallback
      const risk = patientContext.risk_score ?? 0;
      const alert = patientContext.alert_level ?? "WATCH";
      const fallback = generateLocalFallback(query, patientContext);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallback,
          source: "client_fallback",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg shadow-primary/25 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 hover:scale-110"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full animate-pulse" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[600px] sm:h-[650px] sm:bottom-4 sm:right-4 flex flex-col">
      <Card className="flex flex-col h-full border-violet-500/30 bg-background/95 backdrop-blur-xl shadow-2xl shadow-violet-500/10">
        {/* Header */}
        <CardHeader className="pb-2 border-b border-violet-500/20 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs">Clinical AI Assistant</div>
                <div className="text-[10px] text-muted-foreground font-normal">
                  {patientContext.name || "Patient"} · {patientContext.alert_level || "WATCH"}
                </div>
              </div>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[9px] border-violet-500/40 text-violet-400">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                RAG
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.source && msg.role === "assistant" && msg.source !== "system" && (
                  <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-border/50">
                    <span className="text-[9px] text-muted-foreground font-mono">
                      via {msg.source === "gemini_rag" ? "Clinical AI + RAG" : msg.source === "biogpt_rag" ? "Clinical AI + RAG" : msg.source === "template_fallback" ? "Clinical Engine" : msg.source === "client_fallback" ? "Local Fallback" : "Clinical AI"}
                    </span>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Quick queries */}
        <div className="px-3 pb-1 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_QUERIES.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                className="text-[10px] h-6 px-2 whitespace-nowrap shrink-0 border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                onClick={() => sendMessage(q)}
                disabled={isLoading}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 pt-1 border-t border-border shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about vitals, treatment, risk..."
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shrink-0"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

/* Client-side fallback when backend is unreachable */
function generateLocalFallback(query: string, ctx: PatientContext): string {
  const risk = ctx.risk_score ?? 0;
  const hr = ctx.heart_rate ?? 75;
  const map = ctx.map ?? 85;
  const temp = ctx.temperature ?? 37;
  const lactate = ctx.lactate ?? 1;
  const alert = ctx.alert_level ?? "WATCH";

  const concerns: string[] = [];
  if (map < 70) concerns.push(`hypotension (MAP ${map} mmHg)`);
  if (lactate > 2) concerns.push(`elevated lactate (${lactate} mmol/L)`);
  if (hr > 100) concerns.push(`tachycardia (HR ${hr} bpm)`);
  if (temp > 38.3) concerns.push(`fever (${temp}°C)`);

  const status = concerns.length > 0
    ? `Current concerns: ${concerns.join(", ")}.`
    : "No acute derangements noted.";

  const riskStr = `Risk score ${(risk * 100).toFixed(1)}% (${alert}).`;

  const ql = query.toLowerCase();
  if (ql.includes("antibiotic")) {
    return `${status} ${riskStr} ${risk > 0.5 ? "Empiric broad-spectrum antibiotics recommended within 1 hour." : "Antibiotic initiation not yet indicated. Continue monitoring."}`;
  }
  if (ql.includes("fluid") || ql.includes("resuscitat")) {
    return `${status} ${riskStr} ${map < 65 ? "Initiate 30 mL/kg crystalloid resuscitation." : "Hemodynamics adequate. Maintenance fluids appropriate."}`;
  }
  if (ql.includes("trend") || ql.includes("trajectory")) {
    return `${status} ${riskStr} Serial trending recommended with q15-min vitals to establish trajectory.`;
  }

  return `${status} ${riskStr} Continue monitoring per protocol. Recommend reassessment in 15 minutes.`;
}
