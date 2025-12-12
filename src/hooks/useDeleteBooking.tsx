import { supabase } from "@/supabaseClient";

export async function useDeleteBooking(id: string) {
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
