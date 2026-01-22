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

  const loadUser = async (session: any) => {
    if (!session?.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    setUser({
      ...session.user,
      profile,
      is_admin: profile?.role === "admin",
    });

    setIsLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      loadUser(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
