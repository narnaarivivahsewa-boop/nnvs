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
      setMessage(
        "Please enter a valid 10 digit mobile number."
      );
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "/api/auth/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile,
            type: "LOGIN",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          data.message ||
            "Failed to send OTP."
        );
        return;
      }

      setOtpSent(true);

      setMessage(
        data.development
          ? "OTP sent. Check the terminal for the development OTP."
          : "OTP sent successfully."
      );
    } catch {
      setMessage(
        "Something went wrong while sending OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage(
        "Please enter a valid 6 digit OTP."
      );
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile,
            otp,
            type: "LOGIN",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          data.message ||
            "OTP verification failed."
        );
        return;
      }

      setMessage(
        "Login Successful ✅"
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch {
      setMessage(
        "Something went wrong while verifying OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-gray-100">

        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-red-900">
            NNVS MATRIMONY
          </h1>

          <p className="mt-2 text-gray-500">
            Login with Mobile OTP
          </p>
        </div>

        <div className="mt-8 space-y-5">

          {/* Mobile */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Mobile Number
            </label>

            <input
              type="tel"
              inputMode="numeric"
              value={mobile}
              maxLength={10}
              disabled={otpSent || loading}
              onChange={(e) =>
                setMobile(
                  e.target.value.replace(/\D/g, "")
                )
              }
              placeholder="Enter 10 digit mobile number"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
            />
          </div>

          {/* Send OTP */}
          {!otpSent && (
            <button
              type="button"
              onClick={sendOTP}
              disabled={loading}
              className="w-full rounded-xl bg-red-800 py-3 font-semibold text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Sending OTP..."
                : "Send OTP"}
            </button>
          )}

          {/* OTP */}
          {otpSent && (
            <>
              <div>
                <label className="mb-2 block font-semibold text-gray-700">
                  Enter OTP
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  maxLength={6}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Enter 6 digit OTP"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl tracking-[0.4em] outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <button
                type="button"
                onClick={verifyOTP}
                disabled={loading}
                className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Verifying..."
                  : "Verify OTP & Login"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setOtp("");
                  setOtpSent(false);
                  setMessage("");
                }}
                className="w-full text-sm font-medium text-red-700 hover:underline"
              >
                Change Mobile Number
              </button>
            </>
          )}

          {/* Message */}
          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-center text-sm font-medium ${
                message.includes("Successful")
                  ? "bg-green-50 text-green-700"
                  : message.includes("sent")
                  ? "bg-blue-50 text-blue-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Your mobile number will be used for secure OTP login.
        </p>

      </div>
    </main>
  );
}