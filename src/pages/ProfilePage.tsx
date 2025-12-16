import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/libs/supabaseClient";
import { useOrder } from "@/hooks/useOrder";
import type { OrderData } from "@/hooks/useOrder";
import Layout from "./Layout";
import Logo from "@/components/Logo";

const brandColor = "#d6c47f";

type UserProfile = {
  id: string;
  name?: string;
  role?: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingSlots, setBookingSlots] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setUser(null);
        setProfile(null);
      } else {
        setUser(data.user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, name, role")
          .eq("id", data.user.id)
          .single();
        setProfile(profileData || null);
      }
      setLoadingUser(false);
    };
    fetchUserAndProfile();
  }, []);

  const isAdmin = profile?.role === "admin";
  const userId = user?.id ?? "";

  const {
    orders,
    loading: loadingOrders,
    error: orderError,
  } = useOrder(userId, false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      const [
        { data: bookingsData },
        { data: bookingSlotsData },
        { data: availabilityData },
      ] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("user_id", userId)
          .order("booked_at", { ascending: false }),
        supabase.from("booking_slots").select("*"),
        supabase.from("availability").select("*"),
      ]);
      setBookings(bookingsData || []);
      setBookingSlots(bookingSlotsData || []);
      setAvailability(availabilityData || []);
    };
    fetchBookings();
  }, [user, userId]);

  useEffect(() => {
    if (!loadingUser) {
      if (!user) navigate("/login");
      else if (isAdmin) navigate("/");
    }
  }, [user, loadingUser, isAdmin, navigate]);

  if (loadingUser) return <p>Loading...</p>;

  const nowNY = new Date();
  const enrichedBookings = bookings
    .map((booking) => {
      const slots = bookingSlots.filter((bs) => bs.booking_id === booking.id);
      if (!slots.length) return null;
      const firstSlot = availability.find(
        (a) => a.id === slots[0].availability_id,
      );
      if (!firstSlot) return null;
      const slotDate = new Date(firstSlot.available_from);
      return {
        ...booking,
        slotIds: slots.map((s) => s.availability_id),
        time: slotDate.toLocaleString("en-US", {
          timeZone: "America/New_York",
        }),
        date: slotDate,
      };
    })
    .filter((b): b is Exclude<typeof b, null> => b !== null)
    .filter((b) => b.date > nowNY)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const cancelBooking = async (booking: any) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    await supabase.from("bookings").delete().eq("id", booking.id);
    setBookings((prev) => prev.filter((b) => b.id !== booking.id));
  };

  return (
    <Layout>
      <Logo size="lg" />
      <div className="w-full max-w-7xl mx-auto py-16 px-4 md:px-6 space-y-10">
        {/* -------------------- My Profile -------------------- */}
        <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: brandColor }}
            >
              My Profile
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {profile ? (
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[280px] bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <p className="text-gray-700">
                    Welcome, {profile.name || "User"}!
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Profile not available</p>
            )}
          </div>
        </section>

        {/* -------------------- Upcoming Appointments -------------------- */}
        <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: brandColor }}
            >
              Upcoming Appointments
            </h2>
            {enrichedBookings.length > 0 && (
              <span className="text-sm font-medium text-white bg-blue-600 px-2 py-0.5 rounded-full">
                {enrichedBookings.length}
              </span>
            )}
          </div>

          <div className="p-6 space-y-4">
            {enrichedBookings.length === 0 && (
              <p className="text-gray-500 text-center">
                No upcoming appointments
              </p>
            )}

            <div className="flex flex-wrap gap-4">
              {enrichedBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex-1 min-w-[280px] bg-gray-50 rounded-xl shadow-sm p-4 border border-gray-100 break-words"
                >
                  <div className="flex justify-between items-start gap-4">
                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p>
                        <strong>Service:</strong> {b.service_type || "N/A"}
                      </p>
                      <p>
                        <strong>Date & Time:</strong> {b.time}
                      </p>
                      {b.notes && (
                        <p className="text-gray-600 break-words whitespace-normal">
                          <strong>Notes:</strong> {b.notes}
                        </p>
                      )}
                    </div>

                    {/* Cancel button */}
                    <button
                      onClick={() => cancelBooking(b)}
                      className="text-sm font-medium text-red-600 hover:text-red-700 transition whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------- Recent Orders -------------------- */}
        <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: brandColor }}
            >
              Recent Orders
            </h2>
            {orders.length > 0 && (
              <span className="text-sm font-medium text-white bg-blue-600 px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            )}
          </div>

          <div className="p-6 space-y-4">
            {orders.length === 0 && (
              <p className="text-gray-500 text-center">
                No recent orders found
              </p>
            )}

            <div className="flex flex-wrap gap-4">
              {orders.map((order: OrderData) => (
                <div
                  key={order.stripe_session_id}
                  className="flex-1 min-w-[280px] bg-gray-50 rounded-xl shadow-sm p-4 border border-gray-100 break-words"
                >
                  <p>
                    <strong>Order Date:</strong>{" "}
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString("en-US", {
                          timeZone: "America/New_York",
                        })
                      : "N/A"}
                  </p>
                  <p className="break-all">
                    <strong>Order ID:</strong>{" "}
                    {order.stripe_session_id || "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong> {order.status || "N/A"}
                  </p>
                  <p>
                    <strong>Amount:</strong> $
                    {order.amount?.toFixed(2) ?? "0.00"}
                  </p>

                  {order.items?.length > 0 && (
                    <ul className="list-disc ml-5 mt-1 text-sm text-gray-700 break-words">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name || "N/A"} x {item.quantity || 0} ($
                          {((item.unit_amount ?? 0) / 100).toFixed(2)})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
