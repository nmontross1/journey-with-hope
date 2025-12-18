import { supabase } from "@/libs/supabaseClient";

export async function useAddAvailability(
  service_type: "reiki" | "tarot" | "consultation" | null,
  start: Date,
) {
  const available_from = new Date(start);
  const available_to = new Date(start);
  available_to.setHours(available_from.getHours() + 1); // adjust as needed

  const { data, error } = await supabase
    .from("availability")
    .insert([
      {
        service_type,
        available_from,
        available_to,
      },
    ])
    .select("*"); // <- returns inserted rows

  if (error) throw error;

  return data || []; // <- ensure array
}
