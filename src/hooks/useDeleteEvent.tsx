import { supabase } from "@/libs/supabaseClient";

export async function useDeleteEvent(eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}
