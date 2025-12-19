import Layout from "./Layout";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Listbox } from "@headlessui/react";
import { useState, useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";
import { useAddBooking } from "@/hooks/useAddBooking";
import { useAvailability } from "@/hooks/useAvailability";
import {
  formatDate,
  fetchBookedSlotIds,
  getSlotsNeeded,
  areConsecutive,
  formatTime,
  parseTime,
  getNowInNY,
} from "@/utils/utils.ts";
import { toast } from "react-toastify";
import Logo from "@/components/Logo";

const services = [
  { value: "reiki", label: "Reiki (1 hour)" },
  { value: "tarot", label: "Tarot (30 minutes)" },
  { value: "combo", label: "Combo (1 hour 30 minutes)" },
  { value: "consultation", label: "1:1 Consultation (30 minutes)" },
];

export default function BookingPage() {
  const [date, setDate] = useState<Date | null>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [serviceType, setServiceType] = useState<
    "reiki" | "tarot" | "combo" | "consultation" | ""
  >("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);
  const { availability, loading, refetch } = useAvailability();

  useEffect(() => {
    const loadBookedSlots = async () => {
      const bookedIds = await fetchBookedSlotIds();
      setBookedSlotIds(bookedIds);
    };
    loadBookedSlots();
  }, []);

  const selectedDate = formatDate(date);
  const nowNY = getNowInNY();
  const todayNY = formatDate(nowNY);

  const slots = (availability[selectedDate] || []).filter((slot) => {
    if (bookedSlotIds.includes(slot.id)) return false;
    if (selectedDate < todayNY) return false;
    if (selectedDate === todayNY) {
      const [h, m] = slot.time.split(":").map(Number);

      const slotNY = new Date(
        nowNY.getFullYear(),
        nowNY.getMonth(),
        nowNY.getDate(),
        h,
        m,
        0,
        0,
      );

      return slotNY > nowNY;
    }
    return true;
  });

  const handleDateChange = (value: any) => {
    if (value instanceof Date) setDate(value);
    else if (Array.isArray(value) && value[0] instanceof Date)
      setDate(value[0]);
    else setDate(null);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !serviceType) {
      toast.info("Please select a time and service");
      return;
    }

    setBookingLoading(true);
    const slotsNeeded = getSlotsNeeded(serviceType);
    const slotIndex = slots.findIndex((s) => s.id === selectedSlot.id);

    if (slotIndex === -1) {
      toast.info("Selected slot not found.");
      setBookingLoading(false);
      return;
    }

    const consecutiveSlots = slots.slice(slotIndex, slotIndex + slotsNeeded);

    if (consecutiveSlots.length < slotsNeeded) {
      toast.info("Not enough consecutive slots available for this service.");
      setBookingLoading(false);
      return;
    }

    if (!areConsecutive(consecutiveSlots, selectedDate)) {
      toast.info("Selected slots are not consecutive.");
      setBookingLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.info("You must be logged in to book.");
        setBookingLoading(false);
        return;
      }

      const slotIds = consecutiveSlots.map((s) => s.id);
      await useAddBooking(slotIds, serviceType, user.id);
      toast.success("Booking confirmed!");

      setBookedSlotIds((prev) => [...prev, ...slotIds]);
      await refetch();
      setSelectedSlot(null);
      setServiceType("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Booking failed. Try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const headingColor = "#d6c47f";

  return (
    <Layout>
      <Logo size="lg" />
      <div className="w-full block px-4 md:px-0">
        <div className="max-w-4xl mx-auto py-6 pb-16 space-y-6">
          <h1
            className="text-3xl font-bold text-center mb-6"
            style={{ color: headingColor }}
          >
            Appointments
          </h1>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6 overflow-hidden">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 min-h-[60vh] w-full flex-wrap">
              {/* Calendar */}
              <div className="bg-gray-50 rounded-xl p-4 flex-1 min-w-[280px] flex flex-col items-center overflow-x-auto">
                <h2
                  className="text-lg font-semibold mb-2 text-center"
                  style={{ color: headingColor }}
                >
                  Pick a Date
                </h2>
                <div className="calendar-wrapper">
                  <Calendar
                    onChange={handleDateChange}
                    value={date}
                    className="react-calendar border-0 rounded-lg shadow-inner p-2 text-center"
                    tileClassName={({ date: calDate }) => {
                      const dateStr = formatDate(calDate);
                      const isToday = dateStr === formatDate(new Date());
                      const hasAvailability = availability[dateStr]?.length > 0;
                      const isSelected = date && dateStr === formatDate(date);

                      return `
        ${isSelected ? "bg-[#d6c47f] text-white rounded-full" : "rounded-lg"}
        ${isToday && !isSelected ? "border-2 border-[#d6c47f]" : ""}
        ${hasAvailability && !isSelected ? "bg-[#d6c47f]/20 font-semibold" : ""}
        cursor-pointer flex items-center justify-center
      `;
                    }}
                    nextLabel="→"
                    prevLabel="←"
                    next2Label={null}
                    prev2Label={null}
                    showNeighboringMonth={false}
                    showDoubleView={false}
                  />
                </div>
              </div>

              {/* Available Times */}
              <div className="flex-1 min-w-[280px] w-full">
                <h2
                  className="text-lg font-semibold mb-4 text-center"
                  style={{ color: headingColor }}
                >
                  Available Times
                </h2>
                <div className="w-full">
                  {loading ? (
                    <div className="text-gray-500 text-center py-8">
                      Loading...
                    </div>
                  ) : slots.length > 0 ? (
                    <ul className="space-y-3 max-h-80 overflow-y-auto break-words">
                      {slots.map((slot) => (
                        <li
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`cursor-pointer px-6 py-3 rounded-lg text-center font-medium shadow-sm transition
                            ${
                              selectedSlot?.id === slot.id
                                ? "bg-[#d6c47f] text-white"
                                : "bg-[#d6c47f]/10 text-[#d6c47f] hover:bg-[#d6c47f]/20"
                            }`}
                        >
                          {formatTime(parseTime(slot.time))}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No available times for this date.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Slot & Service */}
            {selectedSlot && (
              <div
                className="mt-6 rounded-xl p-6 space-y-4 overflow-x-auto"
                style={{ backgroundColor: "#d6c47f/10" }}
              >
                <h3
                  className="text-lg font-semibold text-center"
                  style={{ color: headingColor }}
                >
                  Selected Time: {formatTime(parseTime(selectedSlot.time))}
                </h3>

                <div className="w-full relative">
                  <Listbox value={serviceType} onChange={setServiceType}>
                    <Listbox.Button
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base text-left focus:ring-2"
                      style={{ borderColor: headingColor }}
                    >
                      {serviceType
                        ? services.find((s) => s.value === serviceType)?.label
                        : "Select a service"}
                    </Listbox.Button>
                    <Listbox.Options
                      className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
                      style={{ borderColor: headingColor }}
                    >
                      {services.map((s) => (
                        <Listbox.Option
                          key={s.value}
                          value={s.value}
                          className={({ active, selected }) =>
                            `cursor-pointer px-4 py-2 ${
                              active ? "bg-[#d6c47f]/20" : ""
                            } ${selected ? "font-semibold" : ""}`
                          }
                        >
                          {s.label}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!serviceType || bookingLoading}
                  className="w-full mt-4 px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: headingColor,
                    color: "white",
                  }}
                >
                  {bookingLoading ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
