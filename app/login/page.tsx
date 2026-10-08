"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Phone,
  KeyRound,
  Lock,
  User,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "";

  // Active Tab: 'OTP' or 'PASSWORD' (Admin)
  const [loginMode, setLoginMode] = useState<"OTP" | "PASSWORD">("OTP");

  // OTP Login State
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Password / Admin Login State
  const [adminUsername, setAdminUsername] = useState("9871592002");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Timer countdown effect for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Send OTP
  const handleSendOTP = async () => {
    setMessage("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setMessage("Please enter a valid 10 digit Indian mobile number.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile,
          type: "LOGIN",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to send OTP.");
        return;
      }

      setOtpSent(true);
      setResendTimer(30); // 30 seconds cooldown
      setMessage(
        data.development
          ? "OTP sent! (In dev mode, check server terminal for code)"
          : "OTP sent successfully to your mobile number."
      );
    } catch {
      setMessage("Something went wrong while sending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Please enter a valid 6 digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile,
          otp,
          type: "LOGIN",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "OTP verification failed.");
        return;
      }

      setMessage("Login Successful! Redirecting...");

      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (data.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 500);
    } catch {
      setMessage("Something went wrong while verifying OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Admin Password Login (Without OTP)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!adminUsername.trim()) {
      setMessage("Please enter your Admin username or mobile number.");
      return;
    }

    if (!adminPassword.trim()) {
      setMessage("Please enter your Admin password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Invalid Admin credentials.");
        return;
      }

      setMessage("Admin Login Successful! Redirecting to Dashboard...");

      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (data.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 500);
    } catch {
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF6EF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF5EB] p-6 sm:p-10 shadow-xl border border-[#DACBB4]">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-3">
            <img
              src="/nnvs-logo.png"
              alt="RishteClub Matrimony"
              className="h-14 w-auto mx-auto object-contain"
            />
          </Link>

          <h1 className="font-serif-luxury text-2xl font-bold text-[#4A121A]">
            RishteClub Login
          </h1>

          <p className="mt-1 text-xs text-[#5A4E48]">
            Welcome back! Please sign in to access your matrimonial portal.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex rounded-2xl bg-[#EDE4D4] p-1.5 border border-[#DACBB4]">
          <button
            type="button"
            onClick={() => {
              setLoginMode("OTP");
              setMessage("");
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              loginMode === "OTP"
                ? "bg-[#4A121A] text-white shadow-sm"
                : "text-[#5A4E48] hover:text-[#4A121A]"
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Mobile OTP Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode("PASSWORD");
              setMessage("");
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              loginMode === "PASSWORD"
                ? "bg-[#C5A059] text-white shadow-sm"
                : "text-[#5A4E48] hover:text-[#4A121A]"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Admin Password Login</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="mt-6 space-y-5">
          {/* ========================================================= */}
          {/* MODE 1: MOBILE OTP LOGIN */}
          {/* ========================================================= */}
          {loginMode === "OTP" && (
            <>
              {/* Mobile Input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#2D221E]">
                  Registered Mobile Number
                </label>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A7972]">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    maxLength={10}
                    disabled={otpSent || loading}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10 digit mobile"
                    className="w-full rounded-xl border border-[#DACBB4] bg-white pl-12 pr-4 py-3 text-xs sm:text-sm font-semibold text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Send OTP Button */}
              {!otpSent && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full rounded-xl bg-[#4A121A] py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#3A0C13] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4 text-[#DFBA73]" />
                  <span>{loading ? "Sending Secure OTP..." : "Send OTP"}</span>
                </button>
              )}

              {/* OTP Input & Verification */}
              {otpSent && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#2D221E]">
                      Enter 6-Digit OTP
                    </label>

                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7972]" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        maxLength={6}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="• • • • • •"
                        className="w-full rounded-xl border border-[#DACBB4] bg-white pl-11 pr-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={loading}
                    className="w-full rounded-xl bg-[#C5A059] py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#B88E4C] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4 text-white" />
                    <span>{loading ? "Verifying..." : "Verify OTP & Sign In"}</span>
                  </button>

                  {/* Resend OTP & Change Mobile Row */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      disabled={loading || resendTimer > 0}
                      onClick={handleSendOTP}
                      className="font-bold text-[#4A121A] hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>
                        {resendTimer > 0
                          ? `Resend OTP in ${resendTimer}s`
                          : "Resend OTP"}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setOtp("");
                        setOtpSent(false);
                        setMessage("");
                        setResendTimer(0);
                      }}
                      className="font-semibold text-[#8A7972] hover:text-[#4A121A] hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* MODE 2: ADMIN PASSWORD LOGIN (BINA OTP) */}
          {/* ========================================================= */}
          {loginMode === "PASSWORD" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-[#C5A059] shrink-0 mt-0.5" />
                <span>
                  Admin Portal Instant Login (No OTP required for authorized administrator).
                </span>
              </div>

              {/* Username / Mobile */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#2D221E]">
                  Admin Username / Mobile
                </label>

                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7972]" />
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Enter Admin Mobile / Username"
                    className="w-full rounded-xl border border-[#DACBB4] bg-white pl-11 pr-4 py-3 text-xs sm:text-sm font-semibold text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#2D221E]">
                  Admin Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7972]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full rounded-xl border border-[#DACBB4] bg-white pl-11 pr-11 py-3 text-xs sm:text-sm font-semibold text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7972] hover:text-[#4A121A]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#4A121A] py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#3A0C13] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4 text-[#DFBA73]" />
                <span>{loading ? "Signing in..." : "Sign In to Admin Portal"}</span>
              </button>
            </form>
          )}

          {/* Feedback Message */}
          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-center text-xs font-semibold ${
                message.includes("Successful")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : message.includes("sent")
                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Footer link */}
          <div className="pt-4 border-t border-[#E8DCC8] text-center space-y-2">
            <p className="text-xs text-[#5A4E48]">
              Don&apos;t have an account yet?{" "}
              <Link href="/register" className="font-bold text-[#4A121A] hover:underline">
                Register Candidate Profile
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}