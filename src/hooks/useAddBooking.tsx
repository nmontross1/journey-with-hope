import { supabase } from "@/supabaseClient";

export async function useAddBooking(
  availabilityIds: string[],
  serviceType: "tarot" | "reiki" | "combo",
  userId: string
) {
  if (availabilityIds.length === 0) throw new Error("No slots to book");

  // Insert booking
  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .insert([{ user_id: userId, service_type: serviceType }])
    .select("id")
    .single();

  if (bookingError || !bookingData) {
    throw new Error("Failed to create booking");
  }

  const bookingId = bookingData.id;

  // Insert booking_slots rows
  const slotInserts = availabilityIds.map((availability_id) => ({
    booking_id: bookingId,
    availability_id,
  }));

  const { error: slotsError } = await supabase.from("booking_slots").insert(slotInserts);

  if (slotsError) {
    // Rollback booking on failure to keep consistency
    await supabase.from("bookings").delete().eq("id", bookingId);
    throw new Error("Failed to book slots");
  }

  return bookingData;
}
