"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";

import {
  GENDERS,
  LOOKING_FOR,
  MARITAL_STATUS,
  HEIGHTS,
} from "../../constants";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function Step2Personal({
  register,
  errors,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Personal Information
      </h2>

      <div className="grid md:grid-cols-2 gap-6">

        <SelectField
          label="Gender"
          options={GENDERS}
          required
          registration={register("gender")}
          error={errors.gender}
        />

        <SelectField
          label="Looking For"
          options={LOOKING_FOR}
          required
          registration={register("lookingFor")}
          error={errors.lookingFor}
        />

        <InputField
          label="Date of Birth"
          type="date"
          required
          registration={register("dateOfBirth")}
          error={errors.dateOfBirth}
        />

        <SelectField
          label="Height"
          options={HEIGHTS}
          required
          registration={register("height")}
          error={errors.height}
        />

        <InputField
          label="Weight (kg)"
          type="number"
          placeholder="Enter weight"
          registration={register("weight")}
          error={errors.weight}
        />

        <SelectField
          label="Marital Status"
          options={MARITAL_STATUS}
          required
          registration={register("maritalStatus")}
          error={errors.maritalStatus}
        />

        <InputField
          label="Religion"
          placeholder="Enter Religion"
          registration={register("religion")}
          error={errors.religion}
        />

        <InputField
          label="Caste"
          placeholder="Enter Caste"
          registration={register("caste")}
          error={errors.caste}
        />

        <InputField
          label="Mother Tongue"
          placeholder="Enter Mother Tongue"
          registration={register("motherTongue")}
          error={errors.motherTongue}
        />

        <InputField
          label="Country"
          placeholder="Enter Country"
          required
          registration={register("country")}
          error={errors.country}
        />

        <InputField
          label="State / Province"
          placeholder="Enter State"
          required
          registration={register("state")}
          error={errors.state}
        />

        <InputField
          label="City"
          placeholder="Enter City"
          required
          registration={register("city")}
          error={errors.city}
        />

        <InputField
          label="Postal / ZIP Code"
          placeholder="Enter Postal Code"
          registration={register("postalCode")}
          error={errors.postalCode}
        />

      </div>
    </div>
  );
}