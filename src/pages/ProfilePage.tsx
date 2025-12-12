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

  return (
    <Layout>
      <Logo />

      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 overflow-x-hidden">
        {/* My Profile */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden w-full max-w-full">
          <div className="p-6" style={{ backgroundColor: brandColor }}>
            <h1 className="text-2xl md:text-3xl font-bold text-center text-white">
              My Profile
            </h1>
          </div>
          <div className="p-6 space-y-4">
            {profile && (
              <h2
                className="text-xl md:text-2xl font-semibold break-words whitespace-normal"
                style={{ color: brandColor }}
              >
                Welcome, {profile.name || "User"}!
              </h2>
            )}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 break-words whitespace-normal w-full max-w-full overflow-hidden">
              <p>
                <strong>User ID:</strong> {userId}
              </p>
            </div>
          </div>
        </div>

        {/* My Orders */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden w-full max-w-full">
          <div className="p-6" style={{ backgroundColor: brandColor }}>
            <h1 className="text-2xl md:text-3xl font-bold text-center text-white">
              My Orders
            </h1>
          </div>
          <div className="p-6 space-y-4">
            {loadingOrders && (
              <p className="text-gray-600">Loading orders...</p>
            )}
            {orderError && <p className="text-red-500">{orderError}</p>}
            {!loadingOrders && orders.length === 0 && (
              <p className="text-gray-500">No orders found.</p>
            )}

            <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full max-w-full overflow-x-hidden">
              {orders.map((order: OrderData) => (
                <div
                  key={order.stripe_session_id}
                  className="flex-1 min-w-[280px] bg-white rounded-xl shadow-sm p-4 break-words whitespace-normal w-full max-w-full overflow-hidden"
                >
                  <p>
                    <strong>Order Date:</strong>{" "}
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString("en-US", {
                          timeZone: "America/New_York",
                        })
                      : "N/A"}
                  </p>
                  <p>
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
                    <ul className="list-disc ml-5 mt-1 break-words whitespace-normal">
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
        </div>

        {/* My Appointments */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden w-full max-w-full">
          <div className="p-6" style={{ backgroundColor: brandColor }}>
            <h1 className="text-2xl md:text-3xl font-bold text-center text-white">
              My Appointments
            </h1>
          </div>
          <div className="p-6 space-y-4">
            {enrichedBookings.length === 0 && (
              <p className="text-gray-500">No upcoming appointments.</p>
            )}

            <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full max-w-full overflow-x-hidden">
              {enrichedBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex-1 min-w-[280px] bg-white rounded-xl shadow-sm p-4 break-words whitespace-normal w-full max-w-full overflow-hidden"
                >
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
