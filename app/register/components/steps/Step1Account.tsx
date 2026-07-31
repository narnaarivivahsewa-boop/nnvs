"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import { RegisterFormData } from "@/types/register";
import { GENDERS } from "@/lib/constants";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";

type Step1AccountProps = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function Step1Account({
  register,
  errors,
}: Step1AccountProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Account Details
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <InputField
          label="Full Name"
          placeholder="Enter your full name"
          required
          {...register("fullName")}
          error={errors.fullName}
        />

        <InputField
          label="Mobile Number"
          type="tel"
          placeholder="Enter mobile number"
          required
          {...register("mobile")}
          error={errors.mobile}
        />

        <InputField
          label="Email Address"
          type="email"
          placeholder="Enter email address"
          required
          {...register("email")}
          error={errors.email}
        />

        <SelectField
          label="I am Registering As"
          options={[...GENDERS]}
          placeholder="Select Profile Type"
          required
          {...register("profileType")}
          error={errors.profileType}
        />

        <InputField
          label="Password"
          type="password"
          placeholder="Create password"
          required
          {...register("password")}
          error={errors.password}
        />

        <div className="md:col-span-2">
          <InputField
            label="Confirm Password"
            type="password"
            placeholder="Confirm password"
            required
            {...register("confirmPassword")}
            error={errors.confirmPassword}
          />
        </div>
      </div>
    </div>
  );
}