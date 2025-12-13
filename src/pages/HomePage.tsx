import Layout from "./Layout";
import Logo from "@/components/Logo";

export default function HomePage() {
  return (
    <Layout>
      <div className="flex flex-col relative min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-start text-center px-4 w-full transition-all duration-300">
          <Logo />
          <img
            id="profile-picture"
            src="images/profile.jpg"
            alt=""
            width="75%"
            style={{ borderRadius: "50%" }}
          />

          <p
            className="text-lg mb-8 max-w-2xl mt-6"
            style={{ color: "#f5f1e6" }}
          >
            I am a Reiki and Stone Medicine Practitioner as well as a Tarot
            Reader. It is my mission to walk alongside you on your healing
            journey and assist you in the ways that I can, through the highest
            form of healing energy: Unconditional Love from Source.
          </p>
        </div>
      </div>
    </Layout>
  );
}
