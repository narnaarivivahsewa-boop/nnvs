"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Phone, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendOTP = async () => {
    setMessage("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setMessage("Please enter a valid 10 digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      setMessage(
        data.development
          ? "OTP sent. (In development mode, check your server terminal for the OTP)"
          : "OTP sent successfully to your mobile number."
      );
    } catch {
      setMessage("Something went wrong while sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Please enter a valid 6 digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        if (data.role === "ADMIN") {
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

  return (
    <main className="min-h-screen bg-[#FAF6EF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF5EB] p-8 sm:p-10 shadow-xl border border-[#DACBB4]">
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
            Enter your registered mobile number for Secure OTP Login.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {/* Mobile */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#2D221E]">
              Mobile Number
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
              onClick={sendOTP}
              disabled={loading}
              className="w-full rounded-xl bg-[#4A121A] py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#3A0C13] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Phone className="h-4 w-4 text-[#DFBA73]" />
              <span>{loading ? "Sending Secure OTP..." : "Send OTP"}</span>
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
                onClick={verifyOTP}
                disabled={loading}
                className="w-full rounded-xl bg-[#C5A059] py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#B88E4C] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-white" />
                <span>{loading ? "Verifying..." : "Verify OTP & Sign In"}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setOtp("");
                  setOtpSent(false);
                  setMessage("");
                }}
                className="w-full text-center text-xs font-semibold text-[#4A121A] hover:underline"
              >
                ← Change Mobile Number
              </button>
            </>
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

          {/* Footer note */}
          <div className="pt-4 border-t border-[#E8DCC8] text-center space-y-2">
            <p className="text-xs text-[#5A4E48]">
              Don&apos;t have an account yet?{" "}
              <Link href="/register" className="font-bold text-[#4A121A] hover:underline">
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}