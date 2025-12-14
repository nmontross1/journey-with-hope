import { useState, useEffect } from "react";
import Layout from "./Layout";
import Logo from "@/components/Logo";
import { supabase } from "@/libs/supabaseClient";
import type { Event } from "@/types/Event";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <Layout>
      <Logo />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-[#d6c47f] mb-10 text-center">
          Upcoming Events
        </h1>

        {loading ? (
          <p className="text-gray-500 text-center">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-center">No upcoming events.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {event.image && (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-48 w-full object-cover"
                  />
                )}

                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-[#d6c47f] mb-2">
                    {event.title}
                  </h2>

                  <p className="text-gray-600 mb-2">
                    <strong>When:</strong> {formatDate(event.start_date)}
                    {event.end_date && <> – {formatDate(event.end_date)}</>}
                  </p>

                  {(event.location || event.address) && (
                    <p className="text-gray-600">
                      <strong>Where:</strong>{" "}
                      {[event.location, event.address]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}

                  <br />

                  <p className="text-gray-600 mb-2">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
