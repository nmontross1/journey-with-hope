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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.is_admin) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        </div>
      </Layout>
    );
  }

  return <Outlet />;
}
