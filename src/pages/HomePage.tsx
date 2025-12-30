import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Logo from "@/components/Logo";

const slides = [
  {
    src: "images/profile.jpg",
    alt: "Tarot",
    link: "/appointments",
    label: "Tarot",
  },
  {
    src: "images/reiki.jpg",
    alt: "Reiki",
    link: "/appointments",
    label: "Reiki",
  },
  {
    src: "images/crystals.jpg",
    alt: "Crystals",
    link: "/shop",
    label: "Crystals",
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Shuffle slides every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    navigate(slides[currentSlide].link);
  };

  return (
    <Layout>
      <div className="flex flex-col relative min-h-screen items-center justify-center px-4 text-center">
        <Logo size="lg" />

        <div
          onClick={handleClick}
          className="cursor-pointer mt-6 transition-transform duration-500 hover:scale-105 flex flex-col items-center"
        >
          <img
            src={slides[currentSlide].src}
            alt={slides[currentSlide].alt}
            className="rounded-full w-72 h-72 md:w-96 md:h-96 object-cover"
          />
          <span className="mt-4 text-2xl font-semibold text-[#f5f1e6]">
            {slides[currentSlide].label}
          </span>
        </div>

        <p className="text-lg mb-8 max-w-2xl mt-8 text-[#f5f1e6]">
          I am a Reiki and Stone Medicine Practitioner as well as a Tarot
          Reader. It is my mission to walk alongside you on your healing journey
          and assist you in the ways that I can, through the highest form of
          healing energy: Unconditional Love from Source.
        </p>
      </div>
    </Layout>
  );
}
