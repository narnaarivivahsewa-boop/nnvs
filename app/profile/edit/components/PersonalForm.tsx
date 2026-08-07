"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "@/app/register/components/form/InputField";
import SelectField from "@/app/register/components/form/SelectField";

import {
  GENDERS,
  MARITAL_STATUS,
  HEIGHTS,
} from "@/app/register/constants";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function PersonalForm({
  register,
  errors,
}: Props) {
  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold text-gray-800">
        Personal Information
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        <InputField
          label="Full Name"
          required
          placeholder="Enter Full Name"
          registration={register("fullName")}
          error={errors.fullName}
        />

        <SelectField
          label="Gender"
          options={GENDERS}
          required
          registration={register("gender")}
          error={errors.gender}
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
          placeholder="Enter Weight"
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
          placeholder="Religion"
          registration={register("religion")}
          error={errors.religion}
        />

        <InputField
          label="Caste"
          placeholder="Caste"
          registration={register("caste")}
          error={errors.caste}
        />

        <InputField
          label="Mother Tongue"
          placeholder="Mother Tongue"
          registration={register("motherTongue")}
          error={errors.motherTongue}
        />

        <InputField
          label="Country"
          placeholder="Country"
          registration={register("country")}
          error={errors.country}
        />

        <InputField
          label="State"
          placeholder="State"
          registration={register("state")}
          error={errors.state}
        />

        <InputField
          label="City"
          placeholder="City"
          registration={register("city")}
          error={errors.city}
        />

        <InputField
          label="Postal Code"
          placeholder="Postal Code"
          registration={register("postalCode")}
          error={errors.postalCode}
        />

      </div>

    </div>
  );
}