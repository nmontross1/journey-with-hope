import { useEffect, useState } from "react";
import Layout from "./Layout";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/libs/supabaseClient";
import { toast } from "react-toastify";
import Logo from "@/components/Logo";

const brandColor = "#d6c47f";

type StockMap = Record<number, number>;

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [stockMap, setStockMap] = useState<StockMap>({});

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    const fetchStock = async () => {
      if (cart.length === 0) return;

      const { data, error } = await supabase
        .from("products")
        .select("id, quantity")
        .in(
          "id",
          cart.map((item) => item.id),
        );

      if (error) {
        console.error(error);
        return;
      }

      const map: StockMap = {};
      data.forEach((p) => {
        map[p.id] = p.quantity;
      });

      setStockMap(map);
    };

    fetchUser();
    fetchStock();
  }, [cart]);

  const handleCheckout = async () => {
    if (!user) {
      toast.info("You must have an account to place an order.", {
        autoClose: 3000,
      });
      return;
    }

    if (cart.length === 0) {
      toast.warning("Your cart is empty.");
      return;
    }

    // ✅ Hard stock validation
    for (const item of cart) {
      const available = stockMap[Number(item.id)];
      if (available === 0 || item.quantity > available) {
        toast.error(
          `"${item.name}" does not have enough stock. Please adjust your cart.`,
        );
        return;
      }
    }

    setLoadingCheckout(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ user_id: user.id, cart }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[CartPage] Checkout error:", errorData);
        toast.error("Failed to create checkout session.");
        setLoadingCheckout(false);
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Checkout URL not returned by server.");
        setLoadingCheckout(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during checkout.");
      setLoadingCheckout(false);
    }
  };

  return (
    <Layout>
      <Logo size="lg" />

      <div className="flex justify-center py-12 px-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div
            className="p-6 text-center"
            style={{ backgroundColor: brandColor }}
          >
            <h1 className="text-2xl font-bold text-white">Your Cart</h1>
          </div>

          <div className="p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                Your cart is empty.
              </div>
            ) : (
              <>
                <ul className="space-y-4">
                  {cart.map((item) => {
                    const available = stockMap[Number(item.id)] ?? Infinity;
                    const atMax = item.quantity >= available;

                    return (
                      <li
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm"
                      >
                        {/* Image + Info */}
                        <div className="flex gap-4 w-full">
                          <img
                            src={item.image || "/placeholder.png"}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />

                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">{item.type}</p>
                            <p className="text-sm text-gray-700 mt-1">
                              ${item.price.toFixed(2)} each
                            </p>

                            {atMax && (
                              <p className="text-xs text-red-500 mt-1">
                                Max stock reached
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                            >
                              −
                            </button>

                            <span className="w-10 text-center">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={atMax}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex justify-between pt-4 border-t text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                  className="w-full py-3 rounded-xl text-white shadow-md hover:opacity-90"
                  style={{ backgroundColor: brandColor }}
                >
                  {loadingCheckout
                    ? "Redirecting to Stripe…"
                    : "Checkout with Stripe"}
                </button>

                <button
                  onClick={clearCart}
                  className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50"
                >
                  Clear Cart
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
