import { useState, useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";

export interface OrderItem {
  name: string | null;
  unit_amount: number;
  quantity: number;
}

export interface OrderData {
  id?: string;
  user_id?: string | null;
  status?: string;
  amount: number;
  items: OrderItem[];
  stripe_session_id?: string | null;
  shipping_address?: Record<string, any> | null;
  created_at?: string;
}

export function useOrder(userId?: string, isAdmin: boolean = false) {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!userId && !isAdmin) return; // skip if no userId and not admin

    setLoading(true);
    setError(null);

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin && userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error: supabaseError } = await query;

    setLoading(false);

    if (supabaseError) {
      setError(supabaseError.message);
      return;
    }

    setOrders((data as OrderData[]) ?? []);
  };

  useEffect(() => {
    fetchOrders();
  }, [userId, isAdmin]);

  return { orders, loading, error, refetch: fetchOrders };
}
