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
}

  const inputClass =
    "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50";

  return (
    <Layout>
      <Logo />
      <div className="flex justify-center items-start py-12 px-4">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6" style={{ backgroundColor: brandColor }}>
            <h1 className="text-2xl font-bold text-center text-white">
              Your Cart
            </h1>
          </div>

          <div className="p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-gray-700">
                Your cart is empty.
              </div>
            ) : (
              <>
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-lg shadow-sm bg-white"
                      style={{ minHeight: "80px" }}
                    >
                      <img
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col gap-1">
                        <span className="font-semibold text-gray-800">
                          {item.name}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {item.type}
                        </span>
                        <span className="text-gray-700 text-sm">
                          ${item.price.toFixed(2)} each
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, Number(e.target.value))
                          }
                          className={inputClass + " w-20"}
                        />
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:underline text-sm mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between items-center mt-6 text-lg font-semibold text-gray-800">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 mt-6 rounded-lg font-medium shadow-md transition-colors"
                  style={{ backgroundColor: brandColor, color: "white" }}
                >
                  Checkout with Stripe
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full py-3 mt-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
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
