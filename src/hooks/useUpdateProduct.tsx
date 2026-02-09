import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/libs/supabaseClient";
import type { Product } from "@/types/Product";

export const useUpdateProduct = () => {
  async function updateProduct(product: Product) {
    const { error } = await supabase
      .from("products")
      .update(product)
      .eq("id", product.id);
    if (error) throw error;
  }

  return useMutation<void, Error, Product>({
    mutationFn: updateProduct,
  });
};
