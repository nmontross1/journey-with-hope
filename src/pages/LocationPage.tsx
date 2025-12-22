import Layout from "./Layout";
import { Link } from "react-router-dom";
import { useAvailability } from "@/hooks/useAvailability";
import { useEffect, useState } from "react";
import {
  getTimeRanges,
  fetchBookedSlotIds,
  getTodayString,
} from "@/utils/utils.ts";
import Logo from "@/components/Logo";

const locations = [
  {
    id: 1,
    name: "Main Store",
    address: "201 Sherman Ave, Vandergrift, PA 15690",
    phone: "(724) 594-3349",
    image: "images/home-store.jpg",
  },
  {
    id: 2,
    name: "Painted Tree Boutiques - Homestead",
    address: "490 E Waterfront Dr, Homestead, PA 15120",
    hours: "Everyday: 10am - 8pm",
    phone: "(412) 326-1100",
    image: "images/painted-tree-store.jpg",
  },
];

export default function LocationPage() {
  const { availability, loading } = useAvailability();
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);

  const todayStr = getTodayString();
  const now = new Date();

  useEffect(() => {
    const loadBookedSlots = async () => {
      const bookedIds = await fetchBookedSlotIds();
      setBookedSlotIds(bookedIds);
    };
    loadBookedSlots();
  }, []);

  const mainStoreSlots = (availability[todayStr] || []).filter(
    (slot) =>
      !bookedSlotIds.includes(slot.id) && new Date(slot.available_from) > now,
  );
  const linkClass =
    "inline-block mt-2 text-[#d6c47f] hover:underline font-medium";

  return (
    <Layout>
      <Logo size="lg" />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-[#d6c47f] mb-10 text-center">
          Locations
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {locations.map((loc) => {
            const isMainStore = loc.name === "Main Store";

            return (
              <div
                key={loc.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <img
                  src={loc.image || "/placeholder.png"}
                  alt={loc.name}
                  className="h-48 w-full object-cover"
                />
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-[#d6c47f] mb-2">
                    {loc.name}
                  </h2>
                  <p className="text-gray-600 mb-1">{loc.address}</p>

                  {isMainStore ? (
                    <div className="mb-2 text-gray-600">
                      <strong>Today's Availability:</strong>

                      {loading ? (
                        <div>Loading...</div>
                      ) : mainStoreSlots.length > 0 ? (
                        <div className="block">
                          {getTimeRanges(mainStoreSlots).join(", ")}
                        </div>
                      ) : (
                        <div>No availability today</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 mb-1">{loc.hours}</p>
                  )}

                  <p className="text-gray-600 mb-3">Phone: {loc.phone}</p>
                  <Link
                    to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      loc.address,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    Get Directions
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
