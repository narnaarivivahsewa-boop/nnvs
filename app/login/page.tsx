"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      setMessage("OTP sent successfully. Check your terminal.");
    } catch {
      setMessage("Something went wrong.");
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

      setMessage("Login Successful ✅");

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-red-800">
          NNVS Matrimony
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Login with Mobile OTP
        </p>

        <div className="space-y-5">
          <div>
            <label className="block mb-2 font-medium">
              Mobile Number
            </label>

            <input
              type="tel"
              value={mobile}
              maxLength={10}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter Mobile Number"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {!otpSent ? (
            <button
              type="button"
              onClick={sendOTP}
              disabled={loading}
              className="w-full rounded-xl bg-red-700 py-3 text-white font-semibold hover:bg-red-800 disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          ) : (
            <>
              <div>
                <label className="block mb-2 font-medium">
                  Enter OTP
                </label>

                <input
                  type="text"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6 Digit OTP"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <button
                type="button"
                onClick={verifyOTP}
                disabled={loading}
                className="w-full rounded-xl bg-green-700 py-3 text-white font-semibold hover:bg-green-800 disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          {message && (
            <p
              className={`text-center text-sm ${
                message.includes("Successful")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}