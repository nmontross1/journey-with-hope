import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";

type Product = {
  name: string;
  type: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
};

export const useAddProduct = () => {
  async function addProduct(product: Product) {
    const { error } = await supabase.from("products").insert([product]);
    if (error) throw error;
  }

  return useMutation<void, Error, Product>({
    mutationFn: addProduct,
  });
};