import { useMutation } from "@tanstack/react-query";
import { supabase } from "../libs/supabaseClient";
import type { Event } from "../types/Event";

export const useAddEvent = () => {
  async function addEvent(event: Event) {
    const { error } = await supabase.from("events").insert([event]);
    if (error) throw error;
  }

  return useMutation<void, Error, Event>({
    mutationFn: addEvent,
  });
};
