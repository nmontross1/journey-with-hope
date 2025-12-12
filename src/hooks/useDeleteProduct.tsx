import { supabase } from "@/libs/supabaseClient";

export async function useDeleteProduct(productId: number) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);
  if (error) throw error;
}
