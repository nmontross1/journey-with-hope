import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { STRIPE_ALLOWED_COUNTRIES } from "./allCountries.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_URL,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    const user_id = body?.user_id;
    const cart = body?.cart;

    if (!user_id || !cart || !Array.isArray(cart)) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or cart" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Validate user
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(user_id);

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ msg: "Invalid user", error: userError }),
        { status: 404, headers: corsHeaders },
      );
    }

    // Fetch products from Supabase to ensure secure pricing
    const productIds = cart.map((item: any) => item.id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, quantity")
      .in("id", productIds);

    if (productsError || !products || products.length === 0) {
      throw new Error("Invalid products");
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Build line items safely using fetched products
    const line_items = cart.map((item: any) => {
      const product = productMap.get(item.id);
      if (!product) throw new Error(`Product not found: ${item.id}`);

      const quantity = Math.max(1, Math.min(item.quantity, 10));
      if (quantity > product.quantity)
        throw new Error(`Insufficient stock for ${product.name}`);

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            metadata: { product_id: String(product.id) },
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity,
      };
    });

    // Create Stripe session with automatic taxes
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      client_reference_id: user_id,
      phone_number_collection: { enabled: true },
      success_url: `${FRONTEND_URL}/profile`,
      cancel_url: `${FRONTEND_URL}/cart`,
      metadata: { user_id },
      shipping_address_collection: {
        allowed_countries: STRIPE_ALLOWED_COUNTRIES,
      },
      automatic_tax: { enabled: true }, // ✅ Automatic taxes
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
