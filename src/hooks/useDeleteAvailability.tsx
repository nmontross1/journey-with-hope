import { supabase } from "@/supabaseClient";

export async function useDeleteAvailability(id: string) {
  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
