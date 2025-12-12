import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

export interface Slot {
  id: string;
  time: string;
}

function getNowInNY() {
  // Get current date/time adjusted to New York timezone
  const now = new Date();
  const nyString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  return new Date(nyString);
}

export function useAvailability() {
  const [availability, setAvailability] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);

      const { data: availabilityData, error: availabilityError } = await supabase
        .from("availability")
        .select("id, available_from");

      if (availabilityError) {
        console.error("Error fetching availability:", availabilityError);
        setLoading(false);
        return;
      }

      const { data: bookedSlotsData, error: bookedSlotsError } = await supabase
        .from("booking_slots")
        .select("availability_id");

      if (bookedSlotsError) {
        console.error("Error fetching booked slots:", bookedSlotsError);
        setLoading(false);
        return;
      }

      const bookedIds = new Set(bookedSlotsData.map((b) => b.availability_id));
      const nowNY = getNowInNY();

      const availableSlots = availabilityData.filter((slot) => {
        if (bookedIds.has(slot.id)) return false;

        const slotDate = new Date(slot.available_from);
        // Convert slot time to NY timezone for accurate comparison
        const slotNYString = slotDate.toLocaleString("en-US", { timeZone: "America/New_York" });
        const slotNYDate = new Date(slotNYString);

        // Filter out slots that are in the past or exactly now
        return slotNYDate > nowNY;
      });

      const grouped: Record<string, Slot[]> = {};
      availableSlots.forEach(({ id, available_from }) => {
        const d = new Date(available_from);
        const dateStr = d.toISOString().split("T")[0];
        const timeStr = d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/New_York",
        });
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push({ id, time: `${timeStr} EST` });
      });

      Object.keys(grouped).forEach((dateKey) => {
        grouped[dateKey].sort((a, b) => (a.time > b.time ? 1 : -1));
      });

      setAvailability(grouped);
      setLoading(false);
    }

    fetchAvailability();
  }, []);

  return { availability, loading, setAvailability };
}
