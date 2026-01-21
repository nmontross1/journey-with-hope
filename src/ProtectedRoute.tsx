import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import Layout from "@/pages/Layout";

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

export function ProtectedRoute({ adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-16">Loading...</div>
      </Layout>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin access is required
  if (adminOnly && user.profile?.role !== "admin") {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-16 px-4 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p style={{ color: "#f5f1e6" }}>
            You do not have permission to view this page.
          </p>
          <img src="/galaxy.jpg" alt="" />
        </div>
      </Layout>
    );
  }

  return <Outlet />;
}
