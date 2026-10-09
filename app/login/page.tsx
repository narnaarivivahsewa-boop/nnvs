"use client";

import { useState, useEffect, Suspense } from "react";
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
  ArrowRight,
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "";

  // Mode: 'PASSWORD' (Default for all users & admin) or 'OTP' (Alternative/Fallback)
  const [loginMode, setLoginMode] = useState<"PASSWORD" | "OTP">("PASSWORD");

  // Password Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login State
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // General State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isNotRegistered, setIsNotRegistered] = useState(false);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ==========================================
  // 1. PRIMARY: PASSWORD LOGIN (Admin & Members)
  // ==========================================
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsNotRegistered(false);

    if (!username.trim()) {
      setMessage("Please enter your registered mobile number or username.");
      return;
    }

    if (!password.trim()) {
      setMessage("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Invalid credentials. Please check your mobile/password.");
        return;
      }

      setMessage("Login Successful! Redirecting...");

      setTimeout(() => {
        const dest = redirectUrl || (data.role === "ADMIN" ? "/admin" : "/dashboard");
        window.location.href = dest;
      }, 300);
    } catch {
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. ALTERNATIVE: OTP LOGIN
  // ==========================================
  const handleSendOTP = async () => {
    setMessage("");
    setIsNotRegistered(false);

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
        if (data.notRegistered || res.status === 404) {
          setIsNotRegistered(true);
        }
        setMessage(data.message || "Failed to send OTP.");
        return;
      }

      setOtpSent(true);
      setResendTimer(90);
      setMessage(data.message || "OTP sent successfully to your mobile number via SMS.");
    } catch {
      setMessage("Something went wrong while sending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        const dest = redirectUrl || (data.role === "ADMIN" ? "/admin" : "/dashboard");
        window.location.href = dest;
      }, 300);
    } catch {
      setMessage("Something went wrong while verifying OTP.");
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

          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#4A121A]">
            {loginMode === "PASSWORD" ? "Sign In with Password" : "Login with Mobile OTP"}
          </h1>

          <p className="mt-1.5 text-xs text-[#5A4E48]">
            {loginMode === "PASSWORD"
              ? "Enter your registered mobile/username and password to continue."
              : "Enter your registered mobile number to receive a secure login OTP."}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-6 grid grid-cols-2 p-1.5 bg-[#F0E6D6] rounded-2xl border border-[#DACBB4]">
          <button
            type="button"
            onClick={() => {
              setLoginMode("PASSWORD");
              setMessage("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              loginMode === "PASSWORD"
                ? "bg-[#4A121A] text-white shadow-md"
                : "text-[#5A4E48] hover:text-[#2D221E]"
            }`}
          >
            <Lock className="h-4 w-4 text-[#DFBA73]" />
            <span>Password Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode("OTP");
              setMessage("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              loginMode === "OTP"
                ? "bg-[#4A121A] text-white shadow-md"
                : "text-[#5A4E48] hover:text-[#2D221E]"
            }`}
          >
            <Phone className="h-4 w-4 text-[#DFBA73]" />
            <span>OTP Login</span>
          </button>
        </div>

        {/* Container */}
        <div className="mt-6 space-y-5">
          {/* ========================================================= */}
          {/* 1. DEFAULT: PASSWORD LOGIN (All Members & Admin) */}
          {/* ========================================================= */}
          {loginMode === "PASSWORD" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Mobile / Username */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#2D221E]">
                  Mobile Number / Username
                </label>

                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7972]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter 10 digit mobile or username"
                    className="w-full rounded-xl border border-[#DACBB4] bg-white pl-11 pr-4 py-3 text-xs sm:text-sm font-semibold text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#2D221E]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("OTP");
                      setMobile(username.replace(/\D/g, ""));
                      setMessage("");
                    }}
                    className="text-[11px] font-semibold text-[#C5A059] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7972]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#4A121A] py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#3A0C13] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4 text-[#DFBA73]" />
                <span>{loading ? "Signing in..." : "Sign In with Password"}</span>
              </button>

              {/* Switch to OTP Login Option */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("OTP");
                    setMobile(username.replace(/\D/g, ""));
                    setMessage("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A121A] hover:text-[#C5A059] transition hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Login with Mobile OTP instead</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* 2. ALTERNATIVE: MOBILE OTP LOGIN */}
          {/* ========================================================= */}
          {loginMode === "OTP" && (
            <div className="space-y-4">
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
                  <span>{loading ? "Sending OTP..." : "Send Login OTP"}</span>
                </button>
              )}

              {/* OTP Input & Verify */}
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

                  {/* Resend OTP & Change Number */}
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

              {/* Back to Password Login */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("PASSWORD");
                    setMessage("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A121A] hover:text-[#C5A059] transition hover:underline"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>← Back to Password Login</span>
                </button>
              </div>
            </div>
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
              <p>{message}</p>
              {isNotRegistered && (
                <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center justify-center">
                  <Link
                    href={`/register?mobile=${encodeURIComponent(mobile || username)}`}
                    className="inline-flex items-center gap-1.5 bg-[#4A121A] text-white font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-[#3A0C13] shadow-sm transition"
                  >
                    <span>Click here to Register Candidate</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Footer link to Register */}
          <div className="pt-4 border-t border-[#E8DCC8] text-center space-y-2">
            <p className="text-xs text-[#5A4E48]">
              Don&apos;t have an account yet?{" "}
              <Link href="/register" className="font-bold text-[#4A121A] hover:underline inline-flex items-center gap-1">
                <span>Register Candidate Profile (One-time OTP)</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF6EF] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF5EB] p-8 text-center text-sm font-semibold text-[#5A4E48] shadow-xl border border-[#DACBB4]">
            Loading login form...
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}