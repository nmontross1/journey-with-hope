import { useState, useEffect } from "react";
import Layout from "./Layout";
import { supabase } from "@/libs/supabaseClient";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { Listbox } from "@headlessui/react";
import Logo from "@/components/Logo";
import type { Product } from "@/types/Product";
import { toast } from "react-toastify";

const brandColor = "#f5f1e6";

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <div
      className="rounded-xl shadow-lg overflow-hidden flex flex-col"
      style={{
        backgroundColor: `${brandColor}20`,
        border: `2px solid ${brandColor}`,
      }}
    >
      <img
        src={product.image || "/placeholder.png"}
        alt={product.name}
        className="h-48 w-full object-cover"
      />
      <div className="p-5 flex-1 flex flex-col">
        <h2
          className="text-xl font-semibold mb-2"
          style={{ color: brandColor }}
        >
          {product.name}
        </h2>
        <p style={{ color: `${brandColor}cc` }} className="mb-1">
          {product.type}
        </p>
        <p style={{ color: `${brandColor}cc` }} className="text-sm mb-2">
          In stock: {product.quantity}
        </p>
        <p
          style={{ color: `${brandColor}cc` }}
          className="flex-1 mb-4 break-words"
        >
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold" style={{ color: brandColor }}>
            ${Number(product.price).toFixed(2)}
          </span>
          <button
            className="px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: brandColor, color: "black" }}
            onClick={(e) => {
              e.preventDefault();
              onAdd(product);
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const { cart, addToCart } = useCart();

  const totalItemsInCart = cart.reduce(
    (total, item) => total + item.quantity,
    0,
  );

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

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      type: product.type,
      price: Number(product.price),
      quantity: 1,
      image: product.image,
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <Layout>
      <Logo size="lg" />

      {/* Cart Icon */}
      <div className="fixed top-4 right-4 z-50">
        <Link to="/cart" aria-label="Shopping Cart">
          <div
            className="relative p-2 rounded-full shadow-lg inline-flex items-center justify-center"
            style={{ backgroundColor: brandColor, color: "black" }}
          >
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

      {filteredProducts.length === 0 && (
        <div
          className="text-center py-12 rounded-xl"
          style={{ color: brandColor }}
        >
          No products match your search.
        </div>
      )}

      <div className="max-w-7xl mx-auto py-12">
        {/* First row: sidebar + first 2 products */}
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar */}
          <aside
            className="rounded-xl shadow-lg p-6 flex flex-col overflow-y-auto max-h-[80vh]"
            style={{
              backgroundColor: `${brandColor}20`,
              border: `2px solid ${brandColor}`,
            }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: brandColor }}
            >
              Filter & Search
            </h2>

            {/* Search */}
            <div className="mb-4 flex-shrink-0">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: brandColor }}
              >
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white"
                placeholder="Search products..."
              />
            </div>

            {/* Type */}
            <div className="mb-4 flex-shrink-0 relative">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: brandColor }}
              >
                Type
              </label>
              <Listbox value={type} onChange={setType}>
                <Listbox.Button
                  className="w-full border rounded-lg px-3 py-2 text-left"
                  style={{
                    borderColor: brandColor,
                    background: "white",
                    color: "black",
                  }}
                >
                  {type === "" ? "All Types" : type}
                </Listbox.Button>
                <Listbox.Options
                  className="absolute mt-1 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-auto z-50 border"
                  style={{ borderColor: brandColor }}
                >
                  <Listbox.Option
                    key="all"
                    value=""
                    className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                  >
                    All Types
                  </Listbox.Option>
                  {types.map((t) => (
                    <Listbox.Option
                      key={t}
                      value={t}
                      className={({ active }) =>
                        `cursor-pointer px-3 py-2 ${active ? "bg-gray-100" : ""}`
                      }
                    >
                      {t}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>

            {/* Price Filters */}
            <div className="mb-4 flex gap-2 flex-shrink-0">
              <div className="flex-1">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: brandColor }}
                >
                  Min Price
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white"
                />
              </div>
              <div className="flex-1">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: brandColor }}
                >
                  Max Price
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white"
                />
              </div>
            </div>

            {/* Reset */}
            <button
              className="w-full rounded px-3 py-2 font-semibold flex-shrink-0"
              style={{ backgroundColor: brandColor, color: "black" }}
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

          {/* First 2 products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {filteredProducts.slice(0, 2).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddToCart}
              />
            ))}
          </div>
        </div>

        {/* Remaining products: full width */}
        {filteredProducts.length > 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
            {filteredProducts.slice(2).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
