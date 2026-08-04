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

  onSendOTP,
  onVerifyOTP,
  onChangeMobile,
}: Step1AccountProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Account Details
      </h2>

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
            label="Mobile Number"
            type="tel"
            placeholder="Enter mobile number"
            required
            registration={register("mobile")}
            error={errors.mobile}
            disabled={otpVerified}
          />

          {!otpVerified && (
            <button
              type="button"
              onClick={onSendOTP}
              disabled={otpLoading}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {otpLoading ? "Sending..." : "Send OTP"}
            </button>
          )}

          {otpVerified && (
            <div className="mt-3 flex items-center gap-3">
              <span className="font-semibold text-green-600">
                ✅ Mobile Verified
              </span>

              <button
                type="button"
                onClick={onChangeMobile}
                className="text-sm font-medium text-blue-700 hover:underline"
              >
                Change Mobile
              </button>
            </div>
          )}
        </div>

        {otpSent && !otpVerified && (
          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Enter OTP
            </label>

            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              placeholder="6 Digit OTP"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            />

            <button
              type="button"
              onClick={onVerifyOTP}
              disabled={otpLoading}
              className="mt-3 rounded-lg bg-green-700 px-4 py-2 text-white transition hover:bg-green-800 disabled:opacity-50"
            >
              {otpLoading ? "Verifying..." : "Verify OTP"}
            </button>
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