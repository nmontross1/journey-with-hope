import HamburgerMenu from "@/components/HamburgerMenu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Sidebar & Mobile Hamburger */}
      <HamburgerMenu />

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 md:ml-64 w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
