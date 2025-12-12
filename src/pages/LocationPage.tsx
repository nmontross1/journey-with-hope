import Layout from "./Layout";
import { Link } from "react-router-dom";
import { useAvailability } from "@/hooks/useAvailability";
import { parse, differenceInMinutes } from "date-fns"

function getTimeRanges(slots: { time: string }[]): string[] {
  if (!slots.length) return [];

  const parseTime = (time: string) =>
    parse(time.replace(" EST", ""), "h:mm a", new Date());

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const ranges: string[] = [];
  let start = slots[0].time;
  let prev = parseTime(start);

  for (let i = 1; i < slots.length; i++) {
    const curr = parseTime(slots[i].time);
    if (differenceInMinutes(curr, prev) !== 30) {
      const rangeStart = parseTime(start);
      const rangeEnd = new Date(prev.getTime() + 30 * 60 * 1000);
      ranges.push(`${formatTime(rangeStart)} - ${formatTime(rangeEnd)}`);
      start = slots[i].time;
    }
    prev = curr;
  }

  const finalStart = parseTime(start);
  const finalEnd = new Date(prev.getTime() + 30 * 60 * 1000);
  ranges.push(`${formatTime(finalStart)} - ${formatTime(finalEnd)}`);

  return ranges;
}

const locations = [
  {
    id: 1,
    name: "Main Store",
    address: "201 Sherman Ave, Vandergrift, PA 15690",
    phone: "(724) 594-3349",
    image:
      "https://scontent.fagc1-2.fna.fbcdn.net/v/t39.30808-6/518291632_10223078742037281_791319216300845580_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=104&ccb=1-7&_nc_sid=833d8c&_nc_ohc=GuzxOHCIwOcQ7kNvwGR9LdB&_nc_oc=AdlRbITzON_bxa7woQ7kSYw_663ZR8-NeU_CEvmCDeXanZH0RhMO3tz1iTU7ACet17k&_nc_zt=23&_nc_ht=scontent.fagc1-2.fna&_nc_gid=tky2KDDOLNmOPXkpQnk7BA&oh=00_AfQ6R2nS9GZIOQicKPWTxDPuKPcgZN0S3zbqbUyv1QPusg&oe=68831234",
  },
  {
    id: 2,
    name: "Painted Tree Boutiques - Homestead",
    address: "490 E Waterfront Dr, Homestead, PA 15120",
    hours: "Everyday: 10am - 8pm",
    phone: "(412) 326-1100",
    image:
      "https://lh3.googleusercontent.com/gps-cs-s/AC9h4np85Z-FlFe80BJAyABqr9pcPiprVAVXmTKDmiH0ZlcOzGsorB1J4Wkk0xNdv4Hewnzf5rgrc6RnemVpXw0vIGjZOEMGBJOzjpaV-lye8cfTzV-xc_rZWH6RyqOJbTNkki96qWOd=s1360-w1360-h1020-rw",
  },
];

export default function LocationPage() {
  const { availability, loading } = useAvailability();
  const todayStr = new Date().toISOString().split("T")[0];
  const mainStoreSlots = availability[todayStr] || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-6">Locations</h1>
        <p className="text-gray-700 mb-10">Here’s where to find us:</p>
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
                  <h2 className="text-2xl font-semibold text-indigo-700 mb-2">{loc.name}</h2>
                  <p className="text-gray-600 mb-1">{loc.address}</p>

                  {/* Dynamic availability for Main Store */}
                  {isMainStore ? (
                    <div className="mb-2 text-gray-600">
                      <strong>Today’s Availability:</strong>{" "}
                      {loading ? (
                        "Loading..."
                      ) : mainStoreSlots.length > 0 ? (
                        <span>{getTimeRanges(mainStoreSlots).join(", ")}</span>
                      ) : (
                        <span>No availability today</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 mb-1">{loc.hours}</p>
                  )}

                  <p className="text-gray-600 mb-3">Phone: {loc.phone}</p>
                  <Link
                    to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      loc.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-indigo-600 hover:underline font-medium"
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
