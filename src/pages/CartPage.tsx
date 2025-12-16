import { useEffect, useState } from "react";
import Layout from "./Layout";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/libs/supabaseClient";
import { toast } from "react-toastify";
import Logo from "@/components/Logo";

const brandColor = "#d6c47f";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [user, setUser] = useState<any>(null);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // --- Fetch current user ---
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      console.log("[CartPage] Current user:", user);
    };
    fetchUser();
  }, []);

  // --- Checkout handler ---
  const handleCheckout = async () => {
    if (!user) {
      toast.info("You must have an account to place an order.", {
        autoClose: 3000,
      });
      return;
    }

    if (!cart || cart.length === 0) {
      toast.warning("Your cart is empty.");
      return;
    }

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
      return;
    }

    const data = await response.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <Layout>
      <Logo />

      {/* Page container */}
      <div className="flex justify-center py-12 px-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
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
                {/* Cart items */}
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm"
                    >
                      <img
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />

                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">{item.type}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>

                      {/* Quantity + Remove */}
                      <div className="flex flex-col items-center gap-2">
                        {/* Quantity stepper */}
                        <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            −
                          </button>

                          <span className="w-10 text-center font-medium text-gray-800">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 transition"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-red-500 hover:text-red-700 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 text-lg font-semibold text-gray-800 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {/* Actions */}
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 rounded-xl font-medium text-white shadow-md transition hover:opacity-90"
                  style={{ backgroundColor: brandColor }}
                >
                  Checkout with Stripe
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full py-3 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
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
