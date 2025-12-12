import { AuthProvider } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./libs/queryClient";
import { ToastContainer } from "react-toastify";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import AdminPage from "@/pages/AdminPage";
import CartPage from "@/pages/CartPage"; 
import BookingPage from "@/pages/BookingPage";
import LocationPage from "@/pages/LocationPage";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/book-an-appointment" element={<BookingPage />} />
            <Route path="/locations" element={<LocationPage />} />

            {/* ProtectedRoute can check for admin privileges */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          </Routes>
        </BrowserRouter>

        <ToastContainer />
      </AuthProvider>
    </QueryClientProvider>
  );
}