import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { supabase } from "@/libs/supabaseClient";
import type { User } from "@supabase/supabase-js";

type UserWithProfile = User & {
  profile?: { role: string; name?: string };
};

export default function HamburgerMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const navigate = useNavigate();

  const loadUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    setUser({ ...authUser, profile: profile || undefined });
  };

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) setUser(null);
        else loadUser();
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  const menuTextClass =
    "text-[#d6c47f] transition font-medium hover:bg-[#384e1d]/10 px-3 py-2 rounded md:text-lg flex items-center space-x-2";

  const menuItems: {
    label: string;
    to: string;
  }[] = [
    !user && { label: "Login / Create Account", to: "/login" },
    user &&
      user.profile?.role !== "admin" && { label: "Profile", to: "/profile" },
    { label: "Shop", to: "/shop" },
    { label: "Appointments", to: "/appointments" },
    { label: "Locations", to: "/locations" },
    { label: "Events", to: "/events" },
    user?.profile?.role === "admin" && { label: "Admin", to: "/admin" },
  ].filter(Boolean) as { label: string; to: string }[];

  return (
    <>
      {/* MOBILE BUTTON */}
      <div className="fixed top-2 left-2 md:top-4 md:left-4 z-40 md:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-[#d6c47f] text-4xl p-2 hover:bg-[#384e1d]/10 rounded"
        >
          <FiMenu />
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-[#384e1d] bg-opacity-95 flex flex-col pt-24 px-4 md:hidden">
          <nav className="flex flex-col space-y-6 text-xl">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={menuTextClass}
              >
                {item.label}
              </Link>
            ))}

            {user && (
              <button
                onClick={handleLogout}
                className={`${menuTextClass} text-left`}
              >
                Logout
              </button>
            )}

            {/* Social Icons Row */}
            <div className="flex items-center justify-center space-x-4 pt-8">
              <a
                href="https://www.facebook.com/profile.php?id=100086688615594"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="hover:opacity-70 transition"
              >
                <img
                  src="/facebook.jpg"
                  alt="Facebook"
                  className="w-7 h-7 object-contain"
                />
              </a>

              <span className="text-[#d6c47f] text-lg">|</span>

              <a
                href="https://www.instagram.com/journey_w_hope/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="hover:opacity-70 transition"
              >
                <img
                  src="/instagram.jpg"
                  alt="Instagram"
                  className="w-7 h-7 object-contain"
                />
              </a>
            </div>

            {/* Contact Email */}
            <div className="text-center text-[#d6c47f] pt-4 text-sm">
              <a
                href="mailto:journeywithope714@gmail.com"
                className="hover:underline"
              >
                Contact: journeywithope714@gmail.com
              </a>
            </div>
          </nav>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:w-64 md:h-full md:pt-20 md:px-4 md:border-r md:border-gray-200 bg-[#384e1d]/90 z-20">
        {/* Menu Items */}
        <div className="flex flex-col space-y-4 flex-grow">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`${menuTextClass} block w-full text-left`}
            >
              {item.label}
            </Link>
          ))}

          {user && (
            <button
              onClick={handleLogout}
              className={`${menuTextClass} block w-full text-left`}
            >
              Logout
            </button>
          )}
        </div>

        {/* Bottom Social Section */}
        <div className="border-t border-[#d6c47f]/30 pt-6 pb-6">
          <div className="flex items-center justify-center space-x-4">
            <a
              href="https://www.facebook.com/profile.php?id=100086688615594"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition"
            >
              <img
                src="/facebook.jpg"
                alt="Facebook"
                className="w-8 h-8 object-contain"
              />
            </a>

            <span className="text-[#d6c47f] text-lg">|</span>

            <a
              href="https://www.instagram.com/journey_w_hope/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition"
            >
              <img
                src="/instagram.jpg"
                alt="Instagram"
                className="w-8 h-8 object-contain"
              />
            </a>
          </div>

          <div className="text-center text-[#d6c47f] text-sm pt-4">
            <a
              href="mailto:journeywithope714@gmail.com"
              className="hover:underline"
            >
              Contact: journeywithope714@gmail.com
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
