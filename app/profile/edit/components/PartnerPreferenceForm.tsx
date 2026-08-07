"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "@/app/register/components/form/InputField";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function PartnerPreferenceForm({
  register,
  errors,
}: Props) {
  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold text-gray-800">
        Partner Preference
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        <InputField
          label="Minimum Age"
          type="number"
          min={18}
          placeholder="Enter Minimum Age"
          registration={register("minAge")}
          error={errors.minAge}
        />

        <InputField
          label="Maximum Age"
          type="number"
          min={18}
          placeholder="Enter Maximum Age"
          registration={register("maxAge")}
          error={errors.maxAge}
        />

        <InputField
          label="Minimum Height"
          placeholder="Enter Minimum Height"
          registration={register("minHeight")}
          error={errors.minHeight}
        />

        <InputField
          label="Maximum Height"
          placeholder="Enter Maximum Height"
          registration={register("maxHeight")}
          error={errors.maxHeight}
        />

        <InputField
          label="Preferred Religion"
          placeholder="Enter Preferred Religion"
          registration={register("preferredReligion")}
          error={errors.preferredReligion}
        />

        <InputField
          label="Preferred Caste"
          placeholder="Enter Preferred Caste"
          registration={register("preferredCaste")}
          error={errors.preferredCaste}
        />

      </div>

    </div>
  );
}