"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";

import {
  HEIGHTS,
  MARITAL_STATUS,
  MANGLIK_OPTIONS,
} from "../../constants";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function Step4Preference({
  register,
  errors,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Partner Preference
      </h2>

      <div className="grid md:grid-cols-2 gap-6">

        <InputField
          label="Preferred Age (From)"
          type="number"
          registration={register("minAge")}
          error={errors.minAge}
        />

        <InputField
          label="Preferred Age (To)"
          type="number"
          registration={register("maxAge")}
          error={errors.maxAge}
        />

        <SelectField
          label="Preferred Height (From)"
          options={HEIGHTS}
          registration={register("minHeight")}
          error={errors.minHeight}
        />

        <SelectField
          label="Preferred Height (To)"
          options={HEIGHTS}
          registration={register("maxHeight")}
          error={errors.maxHeight}
        />

        <SelectField
          label="Preferred Marital Status"
          options={["Any", ...MARITAL_STATUS]}
        />

        <InputField
          label="Preferred Religion"
          registration={register("preferredReligion")}
          error={errors.preferredReligion}
        />

        <InputField
          label="Preferred Caste"
          registration={register("preferredCaste")}
          error={errors.preferredCaste}
        />

        <InputField
          label="Preferred Education"
        />

        <InputField
          label="Preferred Occupation"
        />

        <InputField
          label="Preferred Country"
        />

        <InputField
          label="Preferred State"
        />

        <InputField
          label="Preferred City"
        />

        <SelectField
          label="Manglik Preference"
          options={MANGLIK_OPTIONS}
        />

      </div>
    </div>
  );
}