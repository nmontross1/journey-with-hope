import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { STRIPE_ALLOWED_COUNTRIES } from "./allCountries.ts";

const DB_URL = Deno.env.get("DB_URL")!;
const DB_SERVICE_ROLE_KEY = Deno.env.get("DB_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL")!;

const supabase = createClient(DB_URL, DB_SERVICE_ROLE_KEY, {
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

    if (!user_id || !cart) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or cart" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(user_id);

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ msg: "Invalid user", error: userError }),
        { status: 404, headers: corsHeaders },
      );
    }

    const filteredCart = cart.filter((item: any) => item.product_id != null);

    if (filteredCart.length === 0) {
      return new Response(JSON.stringify({ error: "No valid items in cart" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cart
        .filter((item: any) => item.product_id != null)
        .map((item: any) => ({
          price_data: {
            currency: "usd",
            product_data: { name: item.name },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
          metadata: {
            product_id: item.product_id.toString(),
          },
        })),
      mode: "payment",
      client_reference_id: user_id,
      phone_number_collection: { enabled: true },
      success_url: `${FRONTEND_URL}/profile`,
      cancel_url: `${FRONTEND_URL}/cart`,
      shipping_address_collection: {
        allowed_countries: STRIPE_ALLOWED_COUNTRIES,
      },
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
