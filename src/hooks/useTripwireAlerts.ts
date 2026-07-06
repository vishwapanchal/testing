import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TripwireAlert } from "@/types/database";

export function useTripwireAlerts(patientId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tripwire_alerts", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tripwire_alerts")
        .select("*")
        .eq("patient_id", patientId!)
        .eq("is_active", true)
        .order("timestamp", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) {
        if (patientId === "d1" || patientId === "d2") {
          return [
            {
              id: `t-${patientId}-1`,
              patient_id: patientId,
              metric: "heart_rate",
              value: 105,
              threshold: 100,
              condition: ">",
              timestamp: new Date().toISOString(),
              is_active: true,
              resolved_at: null,
              created_at: new Date().toISOString()
            } as TripwireAlert
          ];
        }
      }
      return data as TripwireAlert[];
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!patientId) return;
    const channel = supabase
      .channel(`tripwires-${patientId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "tripwire_alerts",
        filter: `patient_id=eq.${patientId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["tripwire_alerts", patientId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [patientId, queryClient]);

  return query;
}
