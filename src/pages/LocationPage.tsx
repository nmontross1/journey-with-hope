import Layout from "./Layout";
import { Link } from "react-router-dom";
import { useAvailability } from "@/hooks/useAvailability";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { supabase } from "@/libs/supabaseClient";
import {
  formatStoreHoursET,
  getTimeRanges,
  fetchBookedSlotIds,
  getTodayString,
} from "@/utils/utils.ts";

const initialLocations = [
  {
    id: 1,
    name: "Main Store",
    address: "201 Sherman Ave, Vandergrift, PA 15690",
    phone: "(724) 594-3349",
    image: "/home-store.jpg",
    hours: "", // will be filled from Supabase
  },
  {
    id: 2,
    name: "Painted Tree Boutiques - Homestead",
    address: "490 E Waterfront Dr, Homestead, PA 15120",
    hours: "Everyday: 10am - 8pm",
    phone: "(412) 326-1100",
    image: "/painted-tree-store.jpg",
  },
];

export default function LocationPage() {
  const { availability, loading } = useAvailability();
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);
  const [locations, setLocations] = useState(initialLocations);

  const todayStr = getTodayString();
  const now = new Date();

  useEffect(() => {
    const loadBookedSlots = async () => {
      const bookedIds = await fetchBookedSlotIds();
      setBookedSlotIds(bookedIds);
    };
    loadBookedSlots();
  }, []);

  // Fetch store hours for main store
  useEffect(() => {
    const fetchStoreHours = async () => {
      const { data, error } = await supabase
        .from("store_hours")
        .select("*")
        .order("start", { ascending: true });

      if (error) {
        console.error("Error fetching store hours:", error);
        return;
      }

      if (data && data.length > 0) {
        const hoursStr = formatStoreHoursET(data);

        setLocations((prev) => {
          const newLocs = [...prev];
          newLocs[0].hours = hoursStr;
          return newLocs;
        });
      }
    };

    fetchStoreHours();
  }, []);

  const mainStoreSlots = (availability[todayStr] || []).filter(
    (slot) =>
      !bookedSlotIds.includes(slot.id) && new Date(slot.available_from) > now,
  );

  return (
    <Layout>
      <Logo size="lg" />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-[#d6c47f] mb-10 text-center">
          Locations
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {locations.map((loc) => {
            const isMainStore = loc.id === 1;

            return (
              <div
                key={loc.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col"
              >
                <img
                  src={loc.image || "/placeholder.png"}
                  alt={loc.name}
                  className="h-48 w-full object-cover"
                />
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-[#d6c47f]">
                      {loc.name}
                    </h2>
                    <p className="text-gray-600">{loc.address}</p>

                    <div className="space-y-2">
                      <div>
                        <strong className="block text-gray-700 mb-1">
                          Today's Store Hours:
                        </strong>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            loc.hours
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {loc.hours || "Closed"}
                        </span>
                      </div>

                      {isMainStore && (
                        <div>
                          <strong className="block text-gray-700 mb-1">
                            Today's Booking Availability:
                          </strong>
                          {loading ? (
                            <div className="text-gray-500 text-sm">
                              Loading...
                            </div>
                          ) : mainStoreSlots.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {getTimeRanges(mainStoreSlots).map((range) => (
                                <span
                                  key={range}
                                  className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-medium"
                                >
                                  {range}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">
                              No availability today
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-gray-600">Phone: {loc.phone}</p>
                    </div>
                  </div>

                  <Link
                    to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-[#d6c47f] hover:underline font-medium"
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
