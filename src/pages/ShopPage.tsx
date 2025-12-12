import { useState, useEffect } from "react";
import Layout from "./Layout";
import { supabase } from "@/supabaseClient";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const { cart, addToCart } = useCart();

  const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error("Error fetching products:", error);
        return;
      }
      if (data) {
        setProducts(data);
        setTypes(Array.from(new Set(data.map((p: any) => p.type))));
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = type ? product.type === type : true;
    const matchesMin = minPrice ? product.price >= Number(minPrice) : true;
    const matchesMax = maxPrice ? product.price <= Number(maxPrice) : true;
    return matchesSearch && matchesType && matchesMin && matchesMax;
  });

  const handleAddToCart = (product: any) => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      type: product.type,
      price: Number(product.price) || 0,
      quantity: 1,
      image: product.image || "",
    });
    alert(`${product.name} added to cart!`);
  };

  return (
    <Layout>
      {/* Cart Icon in top right */}
      <div className="fixed top-4 right-4 z-50">
        <Link to="/cart" aria-label="Shopping Cart">
          <div className="relative p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg inline-flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.2 6m0 0a1 1 0 001 1h12a1 1 0 001-1m-14-6h14"
              />
            </svg>
            {totalItemsInCart > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                {totalItemsInCart}
              </span>
            )}
          </div>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 md:mb-0">
          <h2 className="text-lg font-semibold mb-4 text-indigo-700">Filter & Search</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Search products..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 flex gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Min Price</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border rounded px-3 py-2"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Price</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border rounded px-3 py-2"
                min={0}
              />
            </div>
          </div>
          <button
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-3 py-2 mt-2"
            onClick={() => {
              setSearch("");
              setType("");
              setMinPrice("");
              setMaxPrice("");
            }}
          >
            Reset Filters
          </button>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-6 text-indigo-600">Shop</h1>
          <p className="text-gray-700 mb-8">Browse and order products to support your journey.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-12">
                No products match your search.
              </div>
            )}
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col"
              >
                <img
                  src={product.image || "/placeholder.png"}
                  alt={product.name}
                  className="h-48 w-full object-cover"
                />
                <div className="p-5 flex-1 flex flex-col">
                  <h2 className="text-xl font-semibold text-indigo-700 mb-2">{product.name}</h2>
                  <p className="text-gray-600 mb-2">{product.type}</p>
                  <p className="text-gray-600 mb-2 text-sm">In stock: {product.quantity}</p>
                  <p className="text-gray-600 mb-4 flex-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-lg font-bold text-indigo-600">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
