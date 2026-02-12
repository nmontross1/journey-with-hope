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
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(
    null,
  );
  const isSoldOut = product.quantity === 0;
  const images =
    product.image && product.image.length > 0
      ? product.image
      : ["/placeholder.png"];
  const currentImageIndex = previewImageIndex ?? 0;

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImageIndex((prev) => {
      if (prev === null) return images.length - 1;
      return prev === 0 ? images.length - 1 : prev - 1;
    });
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImageIndex((prev) => {
      if (prev === null) return 1 % images.length;
      return (prev + 1) % images.length;
    });
  };

  return (
    <>
      <div
        className={`rounded-xl shadow-lg overflow-hidden flex flex-col ${
          isSoldOut ? "opacity-60" : ""
        }`}
        style={{
          backgroundColor: `${brandColor}20`,
          border: `2px solid ${brandColor}`,
        }}
      >
        {/* Image with counter */}
        <div className="relative">
          <img
            src={images[0]}
            alt={product.name}
            className="h-48 w-full object-cover cursor-pointer hover:opacity-90 transition"
            onClick={() => setPreviewImageIndex(0)}
          />
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {images.length} photos
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: brandColor }}
          >
            {product.name}
          </h2>

          <p className="mb-1" style={{ color: `${brandColor}cc` }}>
            {product.type}
          </p>

          {isSoldOut ? (
            <p className="text-sm font-semibold mb-2 text-red-600">Sold Out</p>
          ) : (
            <p className="text-sm mb-2" style={{ color: `${brandColor}cc` }}>
              In stock: {product.quantity}
            </p>
          )}

          <p
            className="flex-1 mb-4 break-words"
            style={{ color: `${brandColor}cc` }}
          >
            {product.description}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-lg font-bold" style={{ color: brandColor }}>
              ${Number(product.price).toFixed(2)}
            </span>

            {!isSoldOut && (
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
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Preview */}
      {previewImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setPreviewImageIndex(null)}
        >
          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={handlePreviousImage}
              className="absolute left-4 text-white hover:text-gray-300 transition p-2"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          {/* Image */}
          <img
            src={images[currentImageIndex]}
            className="max-w-full max-h-full object-contain"
          />

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={handleNextImage}
              className="absolute right-4 text-white hover:text-gray-300 transition p-2"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [shopMessage, setShopMessage] = useState("");
  const { cart, addToCart } = useCart();

  const totalItemsInCart = cart.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from("products").select("*");
      if (error) return console.error(error);
      if (data) {
        const cleaned = data.map((p: Product) => ({
          ...p,
          type: p.type.trim(),
        }));
        setProducts(cleaned);
        setTypes([...new Set(cleaned.map((p) => p.type))]);
      }
    }
    fetchProducts();

    const fetchMessage = async () => {
      const { data, error } = await supabase
        .from("site_messages")
        .select("content")
        .eq("id", "shop")
        .single();
      if (!error && data) setShopMessage(data.content);
    };
    fetchMessage();
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
    if (product.quantity === 0) {
      toast.error("This item is sold out.");
      return;
    }

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

      {/* Site Message */}
      {shopMessage && (
        <div
          id="message"
          className="mt-4 mb-6 px-4 py-2 bg-[#d6c47f] rounded max-w-7xl mx-auto text-center"
        >
          {shopMessage}
        </div>
      )}

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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.2 6a1 1 0 001 1h12a1 1 0 001-1m-14-6h14"
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

      <div className="max-w-7xl mx-auto py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Filters Card */}
          <aside
            className="rounded-xl shadow-lg p-6 flex flex-col"
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

            <div className="mb-4">
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

            <div className="mb-4 relative">
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

            <div className="mb-4 flex gap-2">
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

            <button
              className="mt-auto w-full rounded px-3 py-2 font-semibold"
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

          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={handleAddToCart}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
