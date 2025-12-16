import { useState, useEffect } from "react";
import Layout from "./Layout";
import { useAddProduct } from "@/hooks/useAddProduct";
import { useAddAvailability } from "@/hooks/useAddAvailability";
import { useDeleteAvailability } from "@/hooks/useDeleteAvailability";
import { useDeleteProduct } from "@/hooks/useDeleteProduct";
import { useDeleteBooking } from "@/hooks/useDeleteBooking";
import { useAddEvent } from "@/hooks/useAddEvent";
import { useDeleteEvent } from "@/hooks/useDeleteEvent";
import { supabase } from "@/libs/supabaseClient";
import { FiPlus } from "react-icons/fi";
import { getNowInNY, formatUTCDate } from "@/utils/utils.ts";
import Logo from "@/components/Logo";
import ImageUpload from "@/components/ImageUpload";
import type { Product } from "@/types/Product.ts";
import type { Event } from "@/types/Event.ts";
import { toast } from "react-toastify";

const nowNY = getNowInNY();
const brandColor = "#d6c47f";

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookingSlots, setBookingSlots] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [availStartDateTime, setAvailStartDateTime] = useState("");
  const [availEndDateTime, setAvailEndDateTime] = useState("");

  const [expandProductForm, setExpandProductForm] = useState(false);
  const [expandEventForm, setExpandEventForm] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    type: "",
    description: "",
    price: "",
    quantity: "",
    image: "",
  });

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    address: "",
    image: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const filteredProducts = products.filter(
    ({ name, type }) =>
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const addProductMutation = useAddProduct();
  const addEventMutation = useAddEvent();

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: productsData },
        { data: availData },
        { data: bookingsData },
        { data: bookingSlotsData },
        { data: profilesData },
        { data: ordersData },
        { data: eventsData },
      ] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("availability").select("*"),
        supabase
          .from("bookings")
          .select("*")
          .order("booked_at", { ascending: false }),
        supabase.from("booking_slots").select("booking_id,availability_id"),
        supabase.from("profiles").select("*"),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("*")
          .order("start_date", { ascending: true }),
      ]);

      setProducts(productsData || []);
      setAvailability(availData || []);
      setBookings(bookingsData || []);
      setBookingSlots(bookingSlotsData || []);
      setProfiles(profilesData || []);
      setOrders(ordersData || []);
      setEvents(eventsData || []);
    };

    fetchData();
  }, []);

  const enrichedBookings = bookings
    .map((booking) => {
      const slots = bookingSlots.filter((bs) => bs.booking_id === booking.id);
      if (!slots.length) return null;

      const firstSlot = availability.find(
        (a) => a.id === slots[0].availability_id,
      );
      if (!firstSlot) return null;

      const slotDate = new Date(firstSlot.available_from);
      const profile = profiles.find((p) => p.id === booking.user_id);

      return {
        ...booking,
        slotIds: slots.map((s) => s.availability_id),
        time: slotDate.toLocaleString("en-US", {
          timeZone: "America/New_York",
        }),
        date: slotDate,
        profile: profile || {},
      };
    })
    .filter(Boolean)
    .filter((b) => (b as any).date > nowNY)
    .sort((a, b) => (a as any).date - (b as any).date) as any[];

  const cancelBooking = async (booking: any) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await useDeleteBooking(booking.id);
      setBookings((bs) => bs.filter((b) => b.id !== booking.id));
      setBookingSlots((bs) => bs.filter((s) => s.booking_id !== booking.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel booking.");
    }
  };

  const createChunks = (startISO: string, endISO: string) => {
    const chunks: Date[] = [];
    let current = new Date(startISO);
    const end = new Date(endISO);
    while (current < end) {
      chunks.push(new Date(current));
      current.setMinutes(current.getMinutes() + 30);
    }
    return chunks;
  };

  const handleAddAvailabilityRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availStartDateTime || !availEndDateTime) {
      toast.info("Please specify both start and end date/time");
      return;
    }

    const startDT = new Date(availStartDateTime);
    if (startDT <= nowNY) {
      toast.info("Start time must be in the future (EST timezone)");
      return;
    }

    if (new Date(availEndDateTime) <= startDT) {
      toast.info("End must be after start");
      return;
    }

    try {
      const slices = createChunks(availStartDateTime, availEndDateTime);
      const results = await Promise.all(
        slices.map((dt) => useAddAvailability(null, dt)),
      );
      const added = results.flat();
      if (added.length) {
        setAvailability((prev) => [...prev, ...added]);
        setAvailStartDateTime("");
        setAvailEndDateTime("");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Remove this slot?")) return;
    await useDeleteAvailability(id);
    setAvailability((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const product: Partial<Product> = {
      name: newProduct.name,
      type: newProduct.type,
      description: newProduct.description,
      image: newProduct.image,
      price: +newProduct.price,
      quantity: +newProduct.quantity,
    };

    try {
      await addProductMutation.mutateAsync(product as Product);
      const { data: productsData } = await supabase
        .from("products")
        .select("*");
      setProducts(productsData || []);
      setNewProduct({
        name: "",
        type: "",
        description: "",
        price: "",
        quantity: "",
        image: "",
      });
    } catch (err: any) {
      toast.error("Add product failed: " + err.message);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await useDeleteProduct(id);
    setProducts((prev) => prev.filter((p) => Number(p.id) !== Number(id)));
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvent.title || !newEvent.start_date) {
      toast.info("Event title and start date are required");
      return;
    }

    try {
      const eventToAdd: Event = {
        id: crypto.randomUUID(),
        title: newEvent.title,
        description: newEvent.description,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date || null,
        location: newEvent.location,
        address: newEvent.address,
        image: newEvent.image || null,
      };

      await addEventMutation.mutateAsync(eventToAdd);

      const { data } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      setEvents(data || []);
      setNewEvent({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        location: "",
        address: "",
        image: "",
      });
    } catch (err: any) {
      toast.error("Add event failed: " + (err.message || err));
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;

    try {
      await useDeleteEvent(id); // pass string directly
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete event.");
    }
  };

  return (
    <Layout>
      <Logo size="lg" />

      <div className="w-full max-w-full overflow-x-hidden mx-auto py-16 px-4 md:px-6 space-y-10">
        {/* -------------------- UPCOMING APPOINTMENTS -------------------- */}
        <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: brandColor }}
            >
              Upcoming Appointments
            </h2>
          </div>

          <ul className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {enrichedBookings.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 hover:bg-gray-50 transition"
                style={{ borderLeft: `4px solid ${brandColor}` }}
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div
                      className="font-semibold text-base truncate"
                      style={{ color: brandColor }}
                    >
                      {b.profile?.name || "N/A"}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                      <div>
                        <span className="font-medium">Time: </span> {b.time}
                      </div>

                      <div>
                        <span className="font-medium">Service: </span>
                        <span className="capitalize">{b.service_type}</span>
                      </div>

                      <div>
                        <span className="font-medium">Birth Month: </span>
                        {b.profile?.birth_month || "N/A"}
                      </div>

                      <div>
                        <span className="font-medium">Contact: </span>
                        {b.profile?.contact_method || "N/A"}
                      </div>

                      <div className="sm:col-span-2">
                        <span className="font-medium">Phone: </span>
                        {b.profile?.phone || "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => cancelBooking(b)}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}

            {enrichedBookings.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-500">
                No upcoming appointments
              </div>
            )}
          </ul>
        </section>

        {/* -------------------- RECENT ORDERS -------------------- */}
        <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: brandColor }}
            >
              Recent Orders
            </h2>
          </div>

          <ul className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 hover:bg-gray-50 transition"
                style={{ borderLeft: `4px solid ${brandColor}` }}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span
                    className="font-semibold text-base"
                    style={{ color: brandColor }}
                  >
                    Order #{order.id}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                    })}
                  </span>
                </div>

                {/* Meta */}
                <div className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">Amount:</span> ${order.amount}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="capitalize">{order.status}</span>
                  </div>
                  <div className="col-span-2 break-all text-xs text-gray-500">
                    <span className="font-medium">Stripe ID:</span>
                    {order.stripe_session_id}
                  </div>
                </div>

                {/* Items */}
                <div className="mt-3">
                  <span className="text-sm font-medium text-gray-800">
                    Items
                  </span>
                  <ul className="mt-1 ml-4 list-disc text-sm text-gray-600 space-y-0.5">
                    {Array.isArray(order.items) &&
                      (
                        order.items as {
                          name: string;
                          quantity: number;
                          unit_amount: number;
                        }[]
                      ).map((it, idx) => (
                        <li key={idx}>
                          {it.name} — {it.quantity} × $
                          {(it.unit_amount / 100).toFixed(2)}
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Contact */}
                <div className="mt-3 text-sm text-gray-700">
                  <span className="font-medium">Phone:</span>
                  {order.customer_phone || "N/A"}
                </div>

                {/* Shipping */}
                {order.shipping_address && (
                  <div className="mt-3 text-sm text-gray-700">
                    <span className="font-medium">Shipping Address</span>
                    <div className="mt-1 ml-2 text-gray-600 space-y-0.5">
                      <div>{order.customer_name}</div>
                      <div>{order.shipping_address.line1}</div>
                      {order.shipping_address.line2 && (
                        <div>{order.shipping_address.line2}</div>
                      )}
                      <div>
                        {order.shipping_address.city},
                        {order.shipping_address.state}
                        {order.shipping_address.postal_code}
                      </div>
                      <div>{order.shipping_address.country}</div>
                    </div>
                  </div>
                )}
              </li>
            ))}

            {orders.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-500">
                No recent orders found
              </div>
            )}
          </ul>
        </section>

        {/* -------------------- MANAGE AVAILABILITY -------------------- */}
        <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: brandColor }}
            >
              Manage Availability
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Form */}
            <form
              onSubmit={handleAddAvailabilityRange}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
            >
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                  value={availStartDateTime}
                  onChange={(e) => setAvailStartDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                  value={availEndDateTime}
                  onChange={(e) => setAvailEndDateTime(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="h-10 rounded-lg text-sm font-medium shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: brandColor, color: "white" }}
              >
                Set Availability
              </button>
            </form>

            {/* Availability List */}
            <ul className="divide-y text-sm max-h-64 overflow-y-auto">
              {availability
                .filter((slot) => new Date(slot.available_from) > nowNY)
                .sort(
                  (a, b) =>
                    new Date(a.available_from).getTime() -
                    new Date(b.available_from).getTime(),
                )
                .map((slot) => (
                  <li
                    key={slot.id}
                    className="flex justify-between items-center py-3"
                  >
                    <span className="text-gray-700">
                      {new Date(slot.available_from).toLocaleString("en-US", {
                        timeZone: "America/New_York",
                      })}
                    </span>

                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                    >
                      Remove
                    </button>
                  </li>
                ))}

              {availability.filter(
                (slot) => new Date(slot.available_from) > nowNY,
              ).length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  No upcoming availability
                </div>
              )}
            </ul>
          </div>
        </section>

        {/* -------------------- MANAGE PRODUCTS -------------------- */}
        <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setExpandProductForm((p) => !p)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: brandColor, color: "white" }}
                aria-label="Add product"
              >
                <FiPlus size={16} />
              </button>

              <h2
                className="text-lg font-semibold tracking-tight"
                style={{ color: brandColor }}
              >
                Manage Products
              </h2>
            </div>

            {!expandProductForm && (
              <input
                type="text"
                placeholder="Search products…"
                className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Add Product Form */}
            {expandProductForm && (
              <form
                onSubmit={handleAddProduct}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {["name", "type", "price", "quantity"].map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {field}
                    </label>
                    <input
                      type={
                        ["price", "quantity"].includes(field)
                          ? "number"
                          : "text"
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                      value={(newProduct as any)[field]}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                ))}

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <ImageUpload
                    bucket="images"
                    folder="products"
                    value={newProduct.image}
                    onUpload={(url) =>
                      setNewProduct((p) => ({ ...p, image: url }))
                    }
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    rows={4}
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={addProductMutation.isPending}
                  className="md:col-span-2 h-11 rounded-lg text-sm font-medium shadow-sm transition hover:opacity-90"
                  style={{ backgroundColor: brandColor, color: "white" }}
                >
                  {addProductMutation.isPending ? "Adding…" : "Add Product"}
                </button>
              </form>
            )}

            {/* Product List */}
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate font-medium"
                      style={{ color: brandColor }}
                    >
                      {p.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${p.price.toFixed(2)} · {p.type} · Qty {p.quantity}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteProduct(Number(p.id))}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                  >
                    Delete
                  </button>
                </li>
              ))}

              {filteredProducts.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500">
                  No products found
                </div>
              )}
            </ul>
          </div>
        </section>

        {/* -------------------- MANAGE EVENTS -------------------- */}
        <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setExpandEventForm((p) => !p)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: brandColor, color: "white" }}
                aria-label="Add event"
              >
                <FiPlus size={16} />
              </button>

              <h2
                className="text-lg font-semibold tracking-tight"
                style={{ color: brandColor }}
              >
                Manage Events
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Add Event Form */}
            {expandEventForm && (
              <form
                onSubmit={handleAddEvent}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, title: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label
                    htmlFor="start_date"
                    className="text-sm font-medium text-gray-700"
                  >
                    Start Date & Time
                  </label>
                  <input
                    id="start_date"
                    type="datetime-local"
                    step="900"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    value={newEvent.start_date}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, start_date: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label
                    htmlFor="end_date"
                    className="text-sm font-medium text-gray-700"
                  >
                    End Date & Time
                  </label>
                  <input
                    id="end_date"
                    type="datetime-local"
                    step="900"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    value={newEvent.end_date}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, end_date: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, location: e.target.value }))
                    }
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    value={newEvent.address}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <ImageUpload
                    bucket="images"
                    folder="events"
                    value={newEvent.image}
                    onUpload={(url) =>
                      setNewEvent((p) => ({ ...p, image: url }))
                    }
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 h-11 rounded-lg text-sm font-medium shadow-sm transition hover:opacity-90"
                  style={{ backgroundColor: brandColor, color: "white" }}
                >
                  Add Event
                </button>
              </form>
            )}

            {/* Event List */}
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p
                      className="font-medium truncate"
                      style={{ color: brandColor }}
                    >
                      {e.title}
                    </p>

                    <p className="text-sm text-gray-600">
                      <strong>When:</strong> {formatUTCDate(e.start_date)} –
                      {formatUTCDate(e.end_date)}
                    </p>

                    {(e.location || e.address) && (
                      <p className="text-sm text-gray-700">
                        <strong>Where:</strong>
                        {[e.location, e.address].filter(Boolean).join(", ")}
                      </p>
                    )}

                    {e.description && (
                      <p className="text-sm text-gray-700">{e.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(e.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                  >
                    Delete
                  </button>
                </li>
              ))}

              {events.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500">
                  No events found
                </div>
              )}
            </ul>
          </div>
        </section>
      </div>
    </Layout>
  );
}
