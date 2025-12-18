import { useState, useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";
import { toZonedTime, format } from "date-fns-tz";

export function useAvailability() {
  const [availability, setAvailability] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("availability").select("*");
      if (error) throw error;

      const grouped: Record<string, any[]> = {};
      const timeZone = "America/New_York";

      data?.forEach((slot) => {
        // convert UTC → NY
        const d = toZonedTime(new Date(slot.available_from), timeZone);

        const dateKey = format(d, "yyyy-MM-dd", { timeZone });
        const time = format(d, "HH:mm", { timeZone });

        if (!grouped[dateKey]) grouped[dateKey] = [];

        grouped[dateKey].push({
          id: slot.id,
          available_from: slot.available_from, // keep original UTC
          time,
          date: d, // now NY date
          service_type: slot.service_type ?? null,
        });
      });

      // sort times
      Object.values(grouped).forEach((daySlots) => {
        daySlots.sort((a, b) =>
          a.time.localeCompare(b.time, undefined, { numeric: true }),
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
