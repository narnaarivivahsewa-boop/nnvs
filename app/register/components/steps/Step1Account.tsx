"use client";

import { Dispatch, SetStateAction } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

import { RegisterFormData } from "@/types/register";
import { GENDERS } from "@/lib/constants";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";

type Step1AccountProps = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;

  otp: string;
  setOtp: Dispatch<SetStateAction<string>>;

  otpSent: boolean;
  otpVerified: boolean;
  otpLoading: boolean;
  resendTimer: number;
  maskedMobile: string;
  otpStatus: { type: "success" | "error" | "info" | null; message: string };

  onSendOTP: () => void;
  onVerifyOTP: () => void;
  onChangeMobile: () => void;
};

export default function Step1Account({
  register,
  errors,

  otp,
  setOtp,

  otpSent,
  otpVerified,
  otpLoading,
  resendTimer,
  maskedMobile,
  otpStatus,

  onSendOTP,
  onVerifyOTP,
  onChangeMobile,
}: Step1AccountProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Account Details
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Create your account and verify your mobile number with a quick SMS OTP.
        </p>
      </div>

      {/* OTP Status Notification Banner */}
      {otpStatus.type && (
        <div
          className={`rounded-xl p-3.5 text-sm flex items-start gap-2.5 transition-all ${
            otpStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : otpStatus.type === "error"
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <span className="text-base font-bold shrink-0">
            {otpStatus.type === "success"
              ? "✓"
              : otpStatus.type === "error"
              ? "✕"
              : "ℹ"}
          </span>
          <span className="leading-snug">{otpStatus.message}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Full Name"
          placeholder="Enter your full name"
          required
          registration={register("fullName")}
          error={errors.fullName}
        />

        <div>
          <InputField
            label="Mobile Number (10 digits)"
            type="tel"
            placeholder="e.g. 9876543210"
            required
            registration={register("mobile")}
            error={errors.mobile}
            disabled={otpVerified || otpSent}
          />

          {/* Send OTP button before sent */}
          {!otpSent && !otpVerified && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onSendOTP}
                disabled={otpLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4A121A] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#380C13] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {otpLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending SMS OTP...
                  </>
                ) : (
                  "📱 Send SMS OTP"
                )}
              </button>
            </div>
          )}

          {/* Verified state */}
          {otpVerified && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 border border-emerald-200">
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5 text-sm">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">✓</span>
                Mobile Number Verified
              </span>

              <button
                type="button"
                onClick={onChangeMobile}
                className="text-xs font-semibold text-gray-600 hover:text-red-700 underline cursor-pointer"
              >
                Change Number
              </button>
            </div>
          )}
        </div>

        {/* OTP Input Card when OTP is sent but not yet verified */}
        {otpSent && !otpVerified && (
          <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-linear-to-b from-amber-50/50 to-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div>
                <label className="block text-sm font-bold text-gray-800">
                  Enter 6-Digit SMS OTP
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Code sent to {maskedMobile || "your mobile number"} via SMS
                </p>
              </div>

              <button
                type="button"
                onClick={onChangeMobile}
                className="text-xs font-semibold text-gray-500 hover:text-red-800 underline cursor-pointer"
              >
                Edit Mobile
              </button>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                placeholder="• • • • • •"
                className="w-full sm:w-60 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest text-gray-900 outline-none focus:border-[#4A121A] focus:ring-3 focus:ring-red-100"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onVerifyOTP}
                  disabled={otpLoading || otp.length !== 6}
                  className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {otpLoading ? "Verifying..." : "Verify OTP ✓"}
                </button>

                {resendTimer > 0 ? (
                  <span className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs font-semibold text-gray-500">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onSendOTP}
                    disabled={otpLoading}
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <InputField
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          required
          registration={register("email")}
          error={errors.email}
        />

        <SelectField
          label="I am Registering As"
          options={[...GENDERS]}
          placeholder="Select Profile Type"
          required
          registration={register("profileType")}
          error={errors.profileType}
        />

        <InputField
          label="Password"
          type="password"
          placeholder="Create password"
          required
          registration={register("password")}
          error={errors.password}
        />

        <div className="md:col-span-2">
          <InputField
            label="Confirm Password"
            type="password"
            placeholder="Confirm password"
            required
            registration={register("confirmPassword")}
            error={errors.confirmPassword}
          />
        </div>
      </div>
    </div>
  );
}