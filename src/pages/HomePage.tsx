import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Logo from "@/components/Logo";

const slides = [
  {
    src: "/profile.jpg",
    alt: "Tarot",
    link: "/appointments",
    label: "Tarot",
  },
  {
    src: "/reiki.jpg",
    alt: "Reiki",
    link: "/appointments",
    label: "Reiki",
  },
  {
    src: "/crystals.jpg",
    alt: "Crystals",
    link: "/shop",
    label: "Crystals",
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => navigate(slides[currentSlide].link);

  return (
    <Layout>
      <div className="flex flex-col relative min-h-screen items-center justify-center px-4 text-center">
        <Logo size="lg" />

        {/* Slide with arrows */}
        <div className="relative mt-6 w-72 md:w-96 h-72 md:h-96">
          <img
            src={slides[currentSlide].src}
            alt={slides[currentSlide].alt}
            onClick={handleClick}
            className="rounded-full w-full h-full object-cover cursor-pointer transition-transform duration-500 hover:scale-105"
          />

          {/* Left arrow */}
          <button
            onClick={prevSlide}
            className="absolute top-1/2 -left-8 md:-left-16 transform -translate-y-1/2 text-3xl md:text-4xl text-[#d6c47f] hover:scale-110 transition"
            aria-label="Previous Slide"
          >
            &lt;
          </button>

          {/* Right arrow */}
          <button
            onClick={nextSlide}
            className="absolute top-1/2 -right-8 md:-right-16 transform -translate-y-1/2 text-3xl md:text-4xl text-[#d6c47f] hover:scale-110 transition"
            aria-label="Next Slide"
          >
            &gt;
          </button>
        </div>

        <span className="mt-4 text-2xl md:text-3xl font-naive text-[#d6c47f]">
          {slides[currentSlide].label}
        </span>

        <p className="text-lg md:text-xl mb-8 max-w-2xl mt-8 text-[#f5f1e6]">
          I am a Reiki and Stone Medicine Practitioner as well as a Tarot
          Reader. It is my mission to walk alongside you on your healing journey
          and assist you in the ways that I can, through the highest form of
          healing energy: Unconditional Love from Source.
        </p>
      </div>
    </Layout>
  );
}
