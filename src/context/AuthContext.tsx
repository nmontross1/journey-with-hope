import { createContext, useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";

type AuthContextType = {
  user: any;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // Fetch the profile to get the role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .single();

        setUser({
          ...authUser,
          profile: profile,
          is_admin: profile?.role === "admin", // Add this for easier checking
        });
      }

      setIsLoading(false);
    };

    getUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
