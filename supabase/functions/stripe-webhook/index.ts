import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      endpointSecret,
    );
  } catch (err: any) {
    return new Response(`Invalid signature: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    });

    // 🔹 1. Save order
    const items = lineItems.data.map((item) => ({
      name: item.description ?? null,
      unit_amount: item.amount_subtotal ?? 0,
      quantity: item.quantity ?? 0,
    }));

    const { error: orderError } = await supabase.from("orders").insert({
      user_id: session.client_reference_id ?? null,
      status: "paid",
      amount: (session.amount_total ?? 0) / 100,
      items,
      stripe_session_id: session.id,
      shipping_address: session.customer_details?.address ?? null,
      customer_name: session.customer_details?.name ?? null,
      customer_phone: session.customer_details?.phone ?? null,
    });

    if (orderError) {
      console.error(orderError);
      return new Response("Order insert failed", { status: 500 });
    }

    // 🔹 2. Decrement inventory (TYPE-SAFE)
    for (const item of lineItems.data) {
      const product =
        item.price?.product && typeof item.price.product !== "string"
          ? item.price.product
          : null;

      const productId =
        product && "metadata" in product ? product.metadata?.product_id : null;

      const quantityPurchased = item.quantity ?? 0;

      if (!productId || quantityPurchased === 0) continue;

      const { error } = await supabase.rpc("decrement_product_quantity", {
        p_product_id: Number(productId),
        p_amount: quantityPurchased,
      });

      if (error) {
        console.error("Inventory decrement failed", error);
        return new Response("Inventory update failed", { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
