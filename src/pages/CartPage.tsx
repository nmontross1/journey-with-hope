import Layout from "./Layout";
import { useCart } from "@/context/CartContext";
import { useEffect } from "react";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Order placed! (Demo)");
    clearCart();
  };

  useEffect(() => {
    console.log("CartPage loaded cart:", cart);
  }, [cart]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-indigo-700 text-center">Your Order</h1>
        {cart.length === 0 ? (
          <div className="text-center text-gray-500 py-16">Your cart is empty.</div>
        ) : (
          <form onSubmit={handleCheckout} className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <ul className="divide-y">
                {cart.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <div className="font-semibold text-indigo-700">{item.name}</div>
                      <div className="text-gray-500 text-sm">{item.type}</div>
                      <div className="text-gray-600 text-sm">${item.price.toFixed(2)} each</div>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, Number(e.target.value))
                      }
                      className="w-16 border rounded px-2 py-1 mr-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center mt-6">
                <span className="font-bold text-lg">Total:</span>
                <span className="text-xl font-bold text-indigo-700">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-indigo-700">Checkout</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input className="border rounded px-3 py-2" placeholder="Full Name" required />
                <input className="border rounded px-3 py-2" placeholder="Email" type="email" required />
                <input className="border rounded px-3 py-2" placeholder="Shipping Address" required />
                <input className="border rounded px-3 py-2" placeholder="City" required />
                <input className="border rounded px-3 py-2" placeholder="State" required />
                <input className="border rounded px-3 py-2" placeholder="Zip Code" required />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Place Order
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
