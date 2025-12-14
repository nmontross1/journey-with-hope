import { useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Logo from "@/components/Logo";

const brandColor = "#d6c47f";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password) return toast.error("Enter a new password");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password reset successfully!");
      navigate("/"); // redirect to login
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors";

  return (
    <Layout>
      <Logo />
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6" style={{ backgroundColor: brandColor }}>
            <h1 className="text-2xl font-bold text-center text-white">
              Reset Password
            </h1>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-medium shadow-md text-white transition-colors"
              style={{ backgroundColor: brandColor }}
            >
              {loading ? "Saving..." : "Set New Password"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
