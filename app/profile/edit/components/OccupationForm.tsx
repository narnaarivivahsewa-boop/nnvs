"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "@/app/register/components/form/InputField";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function OccupationForm({
  register,
  errors,
}: Props) {
  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold text-gray-800">
        Occupation Details
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        <InputField
          label="Profession"
          placeholder="Enter Profession"
          registration={register("profession")}
          error={errors.profession}
        />

        <InputField
          label="Company / Organization"
          placeholder="Enter Company Name"
          registration={register("company")}
          error={errors.company}
        />

        <InputField
          label="Annual Income"
          placeholder="Enter Annual Income"
          registration={register("annualIncome")}
          error={errors.annualIncome}
        />

      </div>

    </div>
  );
}