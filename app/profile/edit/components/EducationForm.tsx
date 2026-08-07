"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "@/app/register/components/form/InputField";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function EducationForm({
  register,
  errors,
}: Props) {
  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold text-gray-800">
        Education Details
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        <InputField
          label="Highest Qualification"
          placeholder="Enter Highest Qualification"
          registration={register("highestQualification")}
          error={errors.highestQualification}
        />

        <InputField
          label="College / University"
          placeholder="Enter College Name"
          registration={register("college")}
          error={errors.college}
        />

        <InputField
          label="Occupation Field"
          placeholder="Enter Occupation Field"
          registration={register("occupationField")}
          error={errors.occupationField}
        />

      </div>

    </div>
  );
}