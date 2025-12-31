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

  // Menu items
  const menuItems: {
    label: string;
    to: string;
    icon?: string;
    external?: boolean;
  }[] = [
    !user && { label: "Login / Create Account", to: "/login" },
    user &&
      user.profile?.role !== "admin" && { label: "Profile", to: "/profile" },
    { label: "Shop", to: "/shop" },
    { label: "Appointments", to: "/appointments" },
    { label: "Locations", to: "/locations" },
    { label: "Events", to: "/events" },
    {
      label: "Facebook",
      to: "https://www.facebook.com/profile.php?id=100086688615594",
      icon: "/images/facebook.jpg",
      external: true,
    },
    {
      label: "Instagram",
      to: "https://www.instagram.com/journey_w_hope/",
      icon: "/images/instagram.jpg",
      external: true,
    },
    user?.profile?.role === "admin" && { label: "Admin", to: "/admin" },
  ].filter(Boolean) as {
    label: string;
    to: string;
    icon?: string;
    external?: boolean;
  }[];

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
            {menuItems.map((item) =>
              item.icon ? (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={menuTextClass}
                  onClick={() => setMenuOpen(false)}
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="w-6 h-6 object-contain"
                  />
                  <span>{item.label}</span>
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={menuTextClass}
                >
                  {item.label}
                </Link>
              ),
            )}

            {user && (
              <button
                onClick={handleLogout}
                className={`${menuTextClass} text-left`}
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:w-64 md:h-full md:pt-20 md:px-4 md:space-y-4 md:border-r md:border-gray-200 bg-[#384e1d]/90 z-20">
        {menuItems.map((item) =>
          item.icon ? (
            <a
              key={item.to}
              href={item.to}
              target="_blank"
              rel="noopener noreferrer"
              className={menuTextClass}
            >
              <img
                src={item.icon}
                alt={item.label}
                className="w-6 h-6 object-contain"
              />
              <span>{item.label}</span>
            </a>
          ) : (
            <Link
              key={item.to}
              to={item.to}
              className={`${menuTextClass} block w-full text-left`}
            >
              {item.label}
            </Link>
          ),
        )}

        {user && (
          <button
            onClick={handleLogout}
            className={`${menuTextClass} block w-full text-left`}
          >
            Logout
          </button>
        )}
      </div>
    </>
  );
}
