import { createContext, useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

type AuthContextType = {
  user: any;
  isLoading: boolean;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      // For local admin testing, add is_admin: true to the user object
      if (data.user) {
        setUser({ ...data.user, is_admin: true });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    getUser();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // For local admin testing, add is_admin: true to the user object
        setUser({ ...session.user, is_admin: true });
      } else {
        setUser(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};