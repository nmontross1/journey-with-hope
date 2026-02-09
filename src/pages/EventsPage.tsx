import { useState, useEffect } from "react";
import Layout from "./Layout";
import Logo from "@/components/Logo";
import { supabase } from "@/libs/supabaseClient";
import type { Event } from "@/types/Event";
import { formatUTCDate } from "@/utils/utils";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("start_date", { ascending: true });

        if (error) throw error;

        setEvents(data || []);
      } catch (err: any) {
        console.error("Failed to fetch events:", err.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <Layout>
      <Logo size="lg" />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-[#d6c47f] mb-10 text-center">
          Upcoming Events
        </h1>

        {loading ? (
          <p className="text-gray-500 text-center">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-center">No upcoming events.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-8">
            {events.map((event) => {
              const isExpanded = expandedEvents.has(event.id);

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-full max-w-md group"
                >
                  {event.image && event.image.length > 0 && (
                    <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                      <img
                        src={event.image[0]}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <h2 className="text-2xl font-semibold text-[#d6c47f] mb-2">
                      {event.title}
                    </h2>

                    <p className="text-gray-600 mb-2">
                      <strong>When: </strong> {formatUTCDate(event.start_date)}{" "}
                      – {formatUTCDate(event.end_date)}
                    </p>

                    {(event.location || event.address) && (
                      <p className="text-gray-600 mb-2">
                        <strong>Where: </strong>
                        {[event.location, event.address]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}

                    {event.description && (
                      <div className="mt-2">
                        <p
                          className={`text-gray-600 transition-all duration-300 ${
                            isExpanded ? "" : "line-clamp-3"
                          }`}
                        >
                          {event.description}
                        </p>

                        {event.description.length > 120 && (
                          <button
                            onClick={() => toggleExpand(event.id)}
                            className="text-[#d6c47f] font-medium mt-1 hover:underline"
                          >
                            {isExpanded ? "See less" : "See more"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
