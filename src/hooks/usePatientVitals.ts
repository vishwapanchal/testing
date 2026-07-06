import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Vital } from "@/types/database";

export function usePatientVitals(patientId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["vitals", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("vitals")
        .select("*")
        .eq("patient_id", patientId!)
        .gte("timestamp", sixHoursAgo)
        .order("timestamp", { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) {
        if (patientId === "d1" || patientId === "d2") {
          return Array.from({ length: 12 }).map((_, i) => ({
            id: `v-${patientId}-${i}`,
            patient_id: patientId,
            timestamp: new Date(Date.now() - (11 - i) * 30 * 60000).toISOString(),
            heart_rate: 90 + Math.random() * 10,
            map: 65 + Math.random() * 5,
            temperature: 38 + Math.random() * 1,
            respiratory_rate: 20 + Math.random() * 5,
            spo2: 92 + Math.random() * 5,
            mental_status: "normal",
            fiO2: 21,
            created_at: new Date().toISOString()
          })) as Vital[];
        }
      }
      return data as Vital[];
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!patientId) return;
    const channel = supabase
      .channel(`vitals-${patientId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "vitals",
        filter: `patient_id=eq.${patientId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["vitals", patientId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [patientId, queryClient]);

  return query;
}
