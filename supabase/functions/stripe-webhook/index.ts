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
    });

    // Map items and extract product_id from metadata
    const items = lineItems.data.map((item) => ({
      name: item.description ?? null,
      unit_amount: item.amount_subtotal ?? 0,
      quantity: item.quantity ?? 0,
      product_id: item.price?.product ? String(item.price.product) : null, // use Stripe product ID
    }));

    // Insert the order
    const { error: insertError } = await supabase.from("orders").insert({
      user_id: session.client_reference_id ?? null,
      status: "paid",
      amount: (session.amount_total ?? 0) / 100,
      items,
      stripe_session_id: session.id,
      shipping_address: session.customer_details?.address ?? null,
      customer_name: session.customer_details?.name ?? null,
      customer_phone: session.customer_details?.phone ?? null,
    });

    if (insertError) {
      return new Response("Insert failed", { status: 500 });
    }

    // Filter items with a valid product_id
    const itemsToUpdate = items.filter((i) => i.product_id && i.quantity > 0);

    if (itemsToUpdate.length > 0) {
      // Fetch current quantities in one query
      const { data: productsData, error: fetchError } = await supabase
        .from("products")
        .select("id, quantity")
        .in("id", itemsToUpdate.map((i) => i.product_id));

      if (fetchError) {
        console.error("Failed to fetch products:", fetchError);
      } else {
        // Prepare batch updates
        const updates = itemsToUpdate.map((item) => {
          const product = productsData?.find((p) => p.id === item.product_id);
          if (!product) return null;
          return {
            id: product.id,
            quantity: Math.max(product.quantity - item.quantity, 0),
          };
        }).filter(Boolean);

        // Update all quantities in one batch
        for (const update of updates) {
          await supabase
            .from("products")
            .update({ quantity: update!.quantity })
            .eq("id", update!.id);
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
