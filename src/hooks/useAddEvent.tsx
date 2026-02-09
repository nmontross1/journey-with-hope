import { supabase } from "@/libs/supabaseClient";
import type { Event } from "@/types/Event";

export const useAddEvent = () => {
  const addEvent = async (event: Event) => {
    const { data, error } = await supabase.from("events").insert(event);
    if (error) throw error;
    return data;
  };

  return {
    mutateAsync: addEvent,
  };
};
