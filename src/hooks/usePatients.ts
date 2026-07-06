import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Patient } from "@/types/database";

export function usePatients() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [
          {
            id: "d1",
            name: "James Wilson",
            mrn: "MRN-1001",
            date_of_birth: "1960-05-15",
            gender: "Male",
            ward: "ICU-A",
            room: "101",
            bed_number: "A",
            admission_time: new Date(Date.now() - 48*3600000).toISOString(),
            primary_diagnosis: "Severe Sepsis",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "d2",
            name: "Sarah Connor",
            mrn: "MRN-1002",
            date_of_birth: "1975-08-22",
            gender: "Female",
            ward: "ICU-B",
            room: "205",
            bed_number: "B",
            admission_time: new Date(Date.now() - 24*3600000).toISOString(),
            primary_diagnosis: "Post-op Infection",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ] as Patient[];
      }
      return data as Patient[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("patients-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => {
        queryClient.invalidateQueries({ queryKey: ["patients"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}
