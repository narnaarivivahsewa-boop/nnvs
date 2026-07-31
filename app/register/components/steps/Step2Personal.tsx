"use client";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";

import {
  GENDERS,
  LOOKING_FOR,
  MARITAL_STATUS,
  HEIGHTS,
} from "../../constants";

export default function Step2Personal() {
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
        />

        <SelectField
          label="Looking For"
          options={LOOKING_FOR}
          required
        />

        <InputField
          label="Date of Birth"
          type="date"
          required
        />

        <SelectField
          label="Height"
          options={HEIGHTS}
          required
        />

        <InputField
          label="Weight (kg)"
          type="number"
          placeholder="Enter weight"
        />

        <SelectField
          label="Marital Status"
          options={MARITAL_STATUS}
          required
        />

        <InputField
          label="Religion"
          placeholder="Enter Religion"
        />

        <InputField
          label="Caste"
          placeholder="Enter Caste"
        />

        <InputField
          label="Mother Tongue"
          placeholder="Enter Mother Tongue"
        />

        <InputField
          label="Country"
          placeholder="Enter Country"
          required
        />

        <InputField
          label="State / Province"
          placeholder="Enter State"
          required
        />

        <InputField
          label="City"
          placeholder="Enter City"
          required
        />

        <InputField
          label="Postal / ZIP Code"
          placeholder="Enter Postal Code"
        />

      </div>
    </div>
  );
}