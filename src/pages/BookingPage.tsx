import Layout from "./Layout";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAddBooking } from "@/hooks/useAddBooking";
import { useAvailability } from "@/hooks/useAvailability";

function formatDate(date: Date | null) {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

export default function BookingPage() {
  const [date, setDate] = useState<Date | null>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [serviceType, setServiceType] = useState<"reiki" | "tarot" | "combo" | "">("");

  const { availability, loading, setAvailability } = useAvailability();

  const selectedDate = formatDate(date);
  const slots = availability[selectedDate] || [];

  const handleDateChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) setDate(value);
    else if (Array.isArray(value) && value[0] instanceof Date) setDate(value[0]);
    else setDate(null);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !serviceType) return;

    const slotsNeeded = { tarot: 1, reiki: 2, combo: 3 }[serviceType];
    const slotIndex = slots.findIndex((s) => s.id === selectedSlot.id);

    if (slotIndex === -1) {
      alert("Selected slot not found.");
      return;
    }

    const consecutiveSlots = slots.slice(slotIndex, slotIndex + slotsNeeded);

    if (consecutiveSlots.length < slotsNeeded) {
      alert("Not enough consecutive slots available for this service.");
      return;
    }

    for (let i = 1; i < consecutiveSlots.length; i++) {
      const prevTime = new Date(`${selectedDate} ${consecutiveSlots[i - 1].time}`);
      const currTime = new Date(`${selectedDate} ${consecutiveSlots[i].time}`);

      if (currTime.getTime() - prevTime.getTime() !== 30 * 60 * 1000) {
        alert("Selected slots are not consecutive.");
        return;
      }
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to book.");
        return;
      }

      const slotIds = consecutiveSlots.map((s) => s.id);

      await useAddBooking(slotIds, serviceType, user.id);
      alert("Booking confirmed!");

      setAvailability((prev) => {
        const updatedSlots = prev[selectedDate]?.filter((slot) => !slotIds.includes(slot.id)) || [];
        return {
          ...prev,
          [selectedDate]: updatedSlots,
        };
      });

      setSelectedSlot(null);
      setServiceType("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Booking failed. Try again.");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-indigo-700">Book an Appointment</h1>
            <p className="text-gray-600 text-lg">
              Choose a date and service to book your appointment with Hope
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-10">
            <div className="bg-gray-50 rounded-xl p-4 flex-1 flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-2 text-indigo-600">Pick a Date</h2>
              <Calendar
                onChange={handleDateChange}
                value={date}
                className="border-0"
                tileClassName={({ date: calDate }) =>
                  availability[formatDate(calDate)] ? "bg-indigo-100 font-semibold" : ""
                }
              />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-4 text-indigo-600 text-center">Available Times</h2>
              <div className="w-full">
                {loading ? (
                  <div className="text-gray-500 text-center py-8">Loading...</div>
                ) : slots.length > 0 ? (
                  <ul className="space-y-3">
                    {slots.map((slot) => (
                      <li
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`cursor-pointer px-6 py-3 rounded-lg text-center font-medium shadow-sm transition
                          ${
                            selectedSlot?.id === slot.id
                              ? "bg-indigo-600 text-white"
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          }
                        `}
                      >
                        {slot.time}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 text-center py-8">No available times for this date.</div>
                )}
              </div>
            </div>
          </div>

          {selectedSlot && (
            <div className="mt-8 text-center space-y-4">
              <h3 className="text-lg font-semibold">You selected: {selectedSlot.time}</h3>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as "reiki" | "tarot" | "combo")}
                className="border rounded px-4 py-2"
              >
                <option value="">Select a service</option>
                <option value="reiki">Reiki (1 hour)</option>
                <option value="tarot">Tarot (30 minutes)</option>
                <option value="combo">Combo (1 hour 30 minutes)</option>
              </select>
              <div>
                <button
                  onClick={handleBooking}
                  disabled={!serviceType}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
