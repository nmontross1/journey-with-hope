import { useState, useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";

export function useAvailability() {
  const [availability, setAvailability] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .gt("available_from", new Date().toISOString());

      if (error) throw error;

      const grouped: Record<string, any[]> = {};

      data?.forEach((slot) => {
        const d = new Date(slot.available_from);

        const dateKey = d.toISOString().split("T")[0];
        const time = d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        if (!grouped[dateKey]) grouped[dateKey] = [];

        grouped[dateKey].push({
          id: slot.id,
          available_from: slot.available_from,
          time,
          date: d,
          service_type: slot.service_type ?? null, // <— SAFE OPTIONAL
        });
      });

      // sort times
      Object.values(grouped).forEach((daySlots) => {
        daySlots.sort((a, b) =>
          a.time.localeCompare(b.time, "en-US", { numeric: true }),
        );
      });

      setAvailability(grouped);
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  return {
    availability,
    loading,
    setAvailability,
    refetch: fetchAvailability,
  };
}
