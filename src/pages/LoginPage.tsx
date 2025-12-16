import { useState, useEffect, Fragment } from "react";
import { supabase } from "@/libs/supabaseClient";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { toast } from "react-toastify";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import { Listbox, Transition } from "@headlessui/react";
import type { LoginForm } from "@/types/LoginForm";
import type { RegisterForm } from "@/types/RegisterForm";
import Logo from "@/components/Logo";

const brandColor = "#d6c47f";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginForm | RegisterForm>({ mode: "onChange" });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    register("birthMonth", { required: isRegistering });
    register("contactMethod", { required: isRegistering });
  }, [register, isRegistering]);

  const onSubmit = async (data: LoginForm | RegisterForm) => {
    setLoading(true);
    try {
      if (forgotPassword) {
        const email = (data as LoginForm).email;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent!");
        setForgotPassword(false);
      } else if (isRegistering) {
        const d = data as RegisterForm;
        if (d.password !== d.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({ email: d.email, password: d.password });
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("User not returned.");

        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: signUpData.user.id,
            name: d.name,
            birth_month: d.birthMonth,
            phone: d.phone,
            over_18: d.over18,
            contact_method: d.contactMethod,
          },
        ]);
        if (profileError) throw profileError;

        toast.success("Registration successful!");
        navigate("/");
      } else {
        const d = data as LoginForm;
        const { data: signInData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: d.email,
            password: d.password,
          });
        if (authError) throw authError;
        if (!signInData.session) throw new Error("Session not returned.");

        await supabase.auth.setSession(signInData.session);
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) throw new Error("Unable to load user.");

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .maybeSingle();

        toast.success("You are logged in successfully!");
        if (profile?.role === "admin") navigate("/admin");
        else navigate("/");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors";

  return (
    <Layout>
      <Logo size="lg"/> />
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6" style={{ backgroundColor: brandColor }}>
            <h1 className="text-2xl font-bold text-center text-white">
              {forgotPassword
                ? "Reset Password"
                : isRegistering
                  ? "Register"
                  : "Login"}
            </h1>
          </div>

          <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className={inputClass}
                  {...register("email", { required: true })}
                />
              </div>

              {!forgotPassword && (
                <>
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      className={inputClass}
                      {...register("password", { required: true })}
                    />
                  </div>

                  {/* Confirm Password (only register) */}
                  {isRegistering && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        className={inputClass}
                        {...register("confirmPassword", {
                          required: "Please confirm your password",
                          validate: (value) =>
                            value === watch("password") ||
                            "Passwords do not match",
                        })}
                      />
                      {(errors as FieldErrors<RegisterForm>)
                        .confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {
                            (errors as FieldErrors<RegisterForm>)
                              .confirmPassword?.message
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* Registration Fields */}
                  {isRegistering && (
                    <>
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          className={inputClass}
                          {...register("name", { required: true })}
                        />
                      </div>

                      {/* Birth Month */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Birth Month
                        </label>
                        <Listbox
                          value={watch("birthMonth") || ""}
                          onChange={(v) =>
                            setValue("birthMonth", v, { shouldValidate: true })
                          }
                        >
                          <div className="relative">
                            <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-3 px-4 text-left shadow-sm focus:outline-none focus:ring-2">
                              <span className="block truncate">
                                {watch("birthMonth") || "Select month"}
                              </span>
                            </Listbox.Button>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg border z-10">
                                {months.map((month) => (
                                  <Listbox.Option
                                    key={month}
                                    value={month}
                                    className={({ active }) =>
                                      `cursor-pointer select-none py-2 px-4 ${
                                        active ? "bg-gray-100" : "text-gray-900"
                                      }`
                                    }
                                  >
                                    {month}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          className={inputClass}
                          {...register("phone", { required: true })}
                        />
                      </div>

                      {/* Contact Method */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Contact Method
                        </label>
                        <input type="hidden" {...register("contactMethod")} />
                        <Listbox
                          value={watch("contactMethod") || ""}
                          onChange={(v) =>
                            setValue("contactMethod", v, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <div className="relative">
                            <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-3 px-4 text-left shadow-sm">
                              <span className="block truncate">
                                {watch("contactMethod")
                                  ? {
                                      call: "Call",
                                      text: "Text",
                                      email: "Email",
                                    }[watch("contactMethod")]
                                  : "Select"}
                              </span>
                            </Listbox.Button>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto bg-white rounded-lg shadow-lg border z-10">
                                {[
                                  { value: "call", label: "Call" },
                                  { value: "text", label: "Text" },
                                  { value: "email", label: "Email" },
                                ].map((option) => (
                                  <Listbox.Option
                                    key={option.value}
                                    value={option.value}
                                    className={({ active }) =>
                                      `cursor-pointer select-none py-2 px-4 ${
                                        active ? "bg-gray-100" : ""
                                      }`
                                    }
                                  >
                                    {option.label}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      </div>

                      {/* Over 18 */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register("over18", { required: true })}
                        />
                        <span>I am over 18</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 flex-col sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer flex-1 py-3 px-4 rounded-lg font-medium shadow-md transition-colors"
                style={{ backgroundColor: brandColor, color: "white" }}
              >
                {loading
                  ? "Loading..."
                  : forgotPassword
                    ? "Send Reset Link"
                    : isRegistering
                      ? "Register"
                      : "Login"}
              </button>

              {!forgotPassword && (
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="cursor-pointer flex-1 py-3 px-4 rounded-lg font-medium border shadow-sm transition-colors"
                  style={{ borderColor: brandColor, color: brandColor }}
                >
                  {isRegistering ? "Login" : "Register"}
                </button>
              )}
            </div>

            {/* Forgot Password Link */}
            {!isRegistering && !forgotPassword && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-sm text-yellow-600 underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
}
