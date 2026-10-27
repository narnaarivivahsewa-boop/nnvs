"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Phone,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { saveAuthSession } from "@/lib/auth/session-storage";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "LOGIN" | "REGISTER";
  redirectUrl?: string;
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "LOGIN",
  redirectUrl = "/dashboard",
  onSuccess,
}: AuthModalProps) {
  const router = useRouter();

  const [mode, setMode] = useState<"LOGIN" | "REGISTER">(initialMode);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // Sync mode with prop
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Resend OTP countdown effect
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setMobile("");
      setOtp("");
      setOtpSent(false);
      setLoading(false);
      setResendTimer(0);
      setStatus({ type: null, message: "" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatus({ type: null, message: "" });

    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setStatus({
        type: "error",
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: "info", message: "Sending OTP via SMS..." });

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
          type: mode === "LOGIN" ? "LOGIN" : "REGISTRATION",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.cooldownRemaining) {
          setResendTimer(data.cooldownRemaining);
        }
        setStatus({
          type: "error",
          message: data.message || "Failed to send SMS OTP.",
        });
        return;
      }

      setOtpSent(true);
      setResendTimer(60);
      setStatus({
        type: "success",
        message: data.message || "OTP sent successfully to your mobile via SMS.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Unable to reach SMS gateway.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setStatus({ type: null, message: "" });
    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

    try {
      setLoading(true);
      setStatus({ type: "info", message: "Resending OTP via Fast2SMS..." });

      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
          type: mode === "LOGIN" ? "LOGIN" : "REGISTRATION",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.cooldownRemaining) {
          setResendTimer(data.cooldownRemaining);
        }
        setStatus({
          type: "error",
          message: data.message || "Failed to resend SMS OTP.",
        });
        return;
      }

      setResendTimer(60);
      setStatus({
        type: "success",
        message: data.message || "OTP resent successfully via Fast2SMS SMS.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Unable to reach SMS gateway.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    const cleanOtp = otp.trim();

    if (!/^\d{4,6}$/.test(cleanOtp)) {
      setStatus({
        type: "error",
        message: "Please enter the valid OTP received on your mobile.",
      });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: "info", message: "Verifying OTP with Fast2SMS..." });

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
          otp: cleanOtp,
          type: mode === "LOGIN" ? "LOGIN" : "REGISTRATION",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          type: "error",
          message: data.message || "Invalid OTP. Please try again.",
        });
        return;
      }

      if (mode === "REGISTER") {
        setStatus({
          type: "success",
          message: "Mobile verified successfully! Redirecting to complete profile...",
        });
        setTimeout(() => {
          onClose();
          router.push(`/register?mobile=${encodeURIComponent(cleanMobile)}&verified=true`);
        }, 800);
        return;
      }

      // Login Flow
      if (data.token) {
        await saveAuthSession(data.token, data.activeProfileId, {
          userId: data.userId,
          role: data.role,
        });
      }

      setStatus({
        type: "success",
        message: "Login successful! Redirecting...",
      });

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
        const dest =
          data.redirectTo ||
          (data.role === "ADMIN" ? "/admin" : redirectUrl || "/dashboard");
        window.location.href = dest;
      }, 600);
    } catch {
      setStatus({
        type: "error",
        message: "Network error while verifying OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#FAF6EF] p-6 sm:p-8 shadow-2xl border border-[#DACBB4] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#4A121A] via-[#C5A059] to-[#4A121A]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#4A3E39] hover:bg-[#FAF0DC] hover:text-[#4A121A] transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-2 pb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#4A121A]/10 text-[#4A121A] mb-3">
            <ShieldCheck className="h-6 w-6 text-[#4A121A]" />
          </div>
          <h2 className="text-2xl font-serif-luxury font-bold text-[#4A121A]">
            {mode === "LOGIN" ? "Fast OTP Sign In" : "Quick OTP Register"}
          </h2>
          <p className="text-xs text-[#7A5835] mt-1 font-medium">
            Fast2SMS Verified SMS Authentication
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 rounded-2xl bg-[#E8DCC8]/50 p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("LOGIN");
              setOtpSent(false);
              setOtp("");
              setStatus({ type: null, message: "" });
            }}
            className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
              mode === "LOGIN"
                ? "bg-white text-[#4A121A] shadow-sm"
                : "text-[#7A5835] hover:text-[#4A121A]"
            }`}
          >
            Login with Mobile
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("REGISTER");
              setOtpSent(false);
              setOtp("");
              setStatus({ type: null, message: "" });
            }}
            className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
              mode === "REGISTER"
                ? "bg-white text-[#4A121A] shadow-sm"
                : "text-[#7A5835] hover:text-[#4A121A]"
            }`}
          >
            New Registration
          </button>
        </div>

        {/* Status Message */}
        {status.message && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : status.type === "error"
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {status.type === "success" && (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            )}
            {status.type === "error" && (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            )}
            {status.type === "info" && (
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* OTP Request / Verification Forms */}
        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label
                htmlFor="auth-modal-mobile"
                className="block text-xs font-bold text-[#4A3E39] mb-1.5 uppercase tracking-wide"
              >
                10-Digit Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-semibold text-[#7A5835]">
                  +91
                </span>
                <input
                  id="auth-modal-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="9876543210"
                  required
                  className="w-full rounded-xl border border-[#DACBB4] bg-white pl-12 pr-4 py-3 text-base font-semibold text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || mobile.length !== 10}
              className="w-full rounded-xl bg-[#4A121A] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#6B1F2D] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="h-4 w-4" />
              <span>{loading ? "Sending SMS OTP..." : "Get SMS OTP"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="auth-modal-otp"
                  className="text-xs font-bold text-[#4A3E39] uppercase tracking-wide"
                >
                  Enter SMS OTP
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setStatus({ type: null, message: "" });
                  }}
                  className="text-xs font-semibold text-[#C5A059] hover:underline cursor-pointer"
                >
                  Change (+91 {mobile})
                </button>
              </div>

              <input
                id="auth-modal-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                className="w-full rounded-xl border border-[#DACBB4] bg-white px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.3em] text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/30"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{loading ? "Verifying..." : "Verify OTP & Continue"}</span>
            </button>

            {/* Resend Controls */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                disabled={loading || resendTimer > 0}
                onClick={handleResendOTP}
                className="font-bold text-[#4A121A] hover:underline flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                </span>
              </button>

              <span className="text-[11px] text-[#7A5835]">
                Strictly SMS OTP
              </span>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-[#E8DCC8] text-center text-[11px] text-[#7A5835]">
          🔒 100% Confidential & Secure Matrimonial Portal
        </div>
      </div>
    </div>
  );
}
