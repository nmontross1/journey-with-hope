import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/libs/supabaseClient";
import type { Product } from "@/types/Product";

export const useAddProduct = () => {
  async function addProduct(product: Product) {
    const { error } = await supabase.from("products").insert([product]);
    if (error) throw error;
  }

  return useMutation<void, Error, Product>({
    mutationFn: addProduct,
  });
};
