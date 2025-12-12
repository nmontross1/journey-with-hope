import { useState, useEffect } from "react";
import Layout from "./Layout";
import { useAddProduct } from "@/hooks/useAddProduct";
import { useAddAvailability } from "@/hooks/useAddAvailability";
import { useDeleteAvailability } from "@/hooks/useDeleteAvailability";
import { useDeleteProduct } from "@/hooks/useDeleteProduct";
import { useDeleteBooking } from "@/hooks/useDeleteBooking";
import { supabase } from "@/supabaseClient";
import { FiPlus, FiChevronDown, FiChevronUp } from "react-icons/fi";

function getNowInNY(): Date {
  const now = new Date();
  const nyString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  return new Date(nyString);
}

export default function AdminPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookingSlots, setBookingSlots] = useState<any[]>([]);

  const [availStartDateTime, setAvailStartDateTime] = useState("");
  const [availEndDateTime, setAvailEndDateTime] = useState("");

  const [expandProductForm, setExpandProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    type: "",
    description: "",
    price: "",
    quantity: "",
    image: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const filteredProducts = products.filter(
    ({ name, type }) =>
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProductMutation = useAddProduct();

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: productsData },
        { data: availData },
        { data: bookingsData },
        { data: bookingSlotsData },
      ] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("availability").select("*"),
        supabase
          .from("bookings")
          .select("id,service_type,user_id,booked_at")
          .order("booked_at", { ascending: false }),
        supabase.from("booking_slots").select("booking_id,availability_id"),
      ]);

      setProducts(productsData || []);
      setAvailability(availData || []);
      setBookings(bookingsData || []);
      setBookingSlots(bookingSlotsData || []);
    };

    fetchData();
  }, []);

  const enrichedBookings = bookings
    .map((booking) => {
      const slots = bookingSlots.filter(bs => bs.booking_id === booking.id);
      const firstSlot = availability.find(a => a.id === slots?.[0]?.availability_id);
      if (!firstSlot) return null;
      const slotDate = new Date(firstSlot.available_from);
      return {
        ...booking,
        slotIds: slots.map(s => s.availability_id),
        time: slotDate.toLocaleString(),
        date: slotDate,
      };
    })
    .filter((b): b is Exclude<typeof b, null> => b !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const cancelBooking = async (booking: any) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await useDeleteBooking(booking.id);
      setBookings(bs => bs.filter(b => b.id !== booking.id));
      setBookingSlots(bs => bs.filter(s => s.booking_id !== booking.id));
      const restored = booking.slotIds.map((id: string) => {
        const slot = bookingSlots.find(bs => bs.availability_id === id);
        return availability.find(a => a.id === id) || slot;
      }).filter(Boolean);
      setAvailability(av => [...av, ...restored]);
    } catch (err: any) {
      alert(err.message || "Failed to cancel booking.");
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
      alert("Please specify both start and end date/time");
      return;
    }
    const nowNY = getNowInNY();
    const startDT = new Date(availStartDateTime);

    if (startDT <= nowNY) {
      alert("Start time must be in the future (EST timezone)");
      return;
    }

    if (new Date(availEndDateTime) <= startDT) {
      alert("End must be after start");
      return;
    }
    try {
      const slices = createChunks(availStartDateTime, availEndDateTime);
      const results = await Promise.all(slices.map(dt => useAddAvailability(null, dt)));
      const added = results.flat();
      if (added.length) {
        setAvailability(prev => [...prev, ...added]);
        setAvailStartDateTime("");
        setAvailEndDateTime("");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Remove this slot?")) return;
    await useDeleteAvailability(id);
    setAvailability(prev => prev.filter(s => s.id !== id));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = {
      ...newProduct,
      price: +newProduct.price,
      quantity: +newProduct.quantity,
    };
    try {
      await addProductMutation.mutateAsync(product);
      setProducts(prev => [...prev, product]);
      setNewProduct({ name: "", type: "", description: "", price: "", quantity: "", image: "" });
    } catch (err: any) {
      alert("Add product failed: " + err.message);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await useDeleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const nowNY = getNowInNY();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-16 px-6 space-y-16">
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-2xl font-semibold text-indigo-700">Upcoming Appointments</h2>
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {enrichedBookings.map(b => (
              <li key={b.id} className="flex justify-between items-center border-b py-2">
                <div>
                  <span className="text-gray-700 font-medium">{b.time}</span>
                  <span className="ml-4 text-indigo-600 font-semibold capitalize">{b.service_type}</span>
                </div>
                <button
                  onClick={() => cancelBooking(b)}
                  className="text-red-600 hover:underline font-semibold"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-2xl font-semibold text-indigo-700">Manage Availability</h2>
          <form onSubmit={handleAddAvailabilityRange} className="flex flex-col md:flex-row md:space-x-4 gap-3">
            <input
              type="datetime-local"
              className="border p-2 rounded w-full"
              value={availStartDateTime}
              onChange={e => setAvailStartDateTime(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              className="border p-2 rounded w-full"
              value={availEndDateTime}
              onChange={e => setAvailEndDateTime(e.target.value)}
              required
            />
            <button type="submit" className="bg-indigo-600 text-white py-2 px-4 rounded">
              Set Availability
            </button>
          </form>
          <ul className="divide-y text-sm text-gray-800 max-h-64 overflow-y-auto">
            {availability
              .filter(slot => new Date(slot.available_from) > nowNY)
              .sort((a, b) => new Date(a.available_from).getTime() - new Date(b.available_from).getTime())
              .map(slot => (
                <li key={slot.id} className="flex justify-between items-center py-2">
                  <span>{new Date(slot.available_from).toLocaleString("en-US", { timeZone: "America/New_York" })}</span>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
          </ul>
        </section>

        <section className="bg-white p-6 rounded-xl shadow space-y-6">
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => setExpandProductForm(p => !p)} className="text-indigo-600 flex gap-1">
              <FiPlus />{expandProductForm ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            <h2 className="text-2xl font-semibold text-indigo-700 flex-grow">Manage Products</h2>
            <input
              type="text"
              placeholder="Search..."
              className="border p-2 rounded max-w-xs"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {expandProductForm && (
            <form onSubmit={handleAddProduct} className="grid md:grid-cols-2 gap-5">
              {["name", "type", "price", "quantity", "image", "description"].map(field => (
                <input
                  key={field}
                  type={["price", "quantity"].includes(field) ? "number" : "text"}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className={`border rounded p-3 text-sm ${["image", "description"].includes(field) ? "md:col-span-2" : ""}`}
                  value={(newProduct as any)[field]}
                  onChange={e => setNewProduct(prev => ({ ...prev, [field]: e.target.value }))}
                  required
                />
              ))}
              <button type="submit" disabled={addProductMutation.isLoading} className="bg-indigo-600 text-white py-3 rounded col-span-full">
                {addProductMutation.isLoading ? "Adding..." : "Add Product"}
              </button>
            </form>
          )}

          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {filteredProducts.map(p => (
              <li key={p.id} className="flex gap-4 items-center bg-indigo-50 rounded p-3 shadow-sm">
                <img src={p.image} alt={p.name} className="w-14 h-14 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-indigo-900">{p.name}</p>
                  <p className="text-sm text-indigo-700">${p.price.toFixed(2)} · {p.type} · Qty: {p.quantity}</p>
                </div>
                <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:underline font-semibold">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
}
