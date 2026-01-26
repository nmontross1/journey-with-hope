import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { STRIPE_ALLOWED_COUNTRIES } from "./allCountries.ts";

/* ----------------------------- Types ----------------------------- */

type CartItem = {
  id: number;
  quantity: number;
};

type CheckoutRequestBody = {
  user_id: string;
  cart: CartItem[];
};

type ProductRow = {
  id: number;
  name: string;
  price: number; // numeric(10,2)
  quantity: number;
};

/* -------------------------- Environment -------------------------- */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL")!;

/* ---------------------------- Clients ---------------------------- */

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/* ---------------------------- Server ----------------------------- */

Deno.serve(async (req) => {
  // --------- Handle CORS ---------
  const origin = req.headers.get("origin") ?? "";
  const ALLOWED_ORIGINS = ["http://localhost:5173", FRONTEND_URL];

  const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Respond immediately to preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    /* ---------------------- Parse Request ----------------------- */
    const bodyText = await req.text();
    const body: CheckoutRequestBody = JSON.parse(bodyText);
    const { user_id, cart } = body;

    if (!user_id || !Array.isArray(cart) || cart.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or cart" }),
        { status: 400, headers: corsHeaders },
      );
    }

    /* ----------------------- Validate User ----------------------- */
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(user_id);

    if (userError || !userData) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    /* --------------------- Fetch Products ------------------------ */
    const productIds = [...new Set(cart.map((item) => item.id))];

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, quantity")
      .in("id", productIds);

    if (productsError || !products || products.length === 0) {
      throw new Error("Invalid products");
    }

    const productMap = new Map<number, ProductRow>(
      products.map((p) => [p.id, p]),
    );

    /* --------------------- Build Line Items ---------------------- */
    const line_items = cart.map((item: CartItem) => {
      const product = productMap.get(item.id);

      if (!product) {
        throw new Error(`Product not found: ${item.id}`);
      }

      const qty = Math.max(1, Math.min(item.quantity, 10));

      if (qty > product.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            metadata: { product_id: String(product.id) },
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: qty,
      };
    });

    /* ------------------- Create Stripe Session ------------------- */
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        line_items,
        client_reference_id: user_id,
        phone_number_collection: { enabled: true },
        success_url: `${FRONTEND_URL}/profile`,
        cancel_url: `${FRONTEND_URL}/cart`,
        metadata: { user_id },
        shipping_address_collection: { allowed_countries: STRIPE_ALLOWED_COUNTRIES },
        automatic_tax: { enabled: true }, // ✅ Taxes enabled
      },
      { idempotencyKey: crypto.randomUUID() },
    );

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Checkout error:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
