"use client";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";

import {
  HEIGHTS,
  MARITAL_STATUS,
  MANGLIK_OPTIONS,
} from "../../constants";

export default function Step4Preference() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Partner Preference
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <InputField
          label="Preferred Age (From)"
          type="number"
          placeholder="Minimum Age"
        />

        <InputField
          label="Preferred Age (To)"
          type="number"
          placeholder="Maximum Age"
        />

        <SelectField
          label="Preferred Height (From)"
          options={HEIGHTS}
        />

        <SelectField
          label="Preferred Height (To)"
          options={HEIGHTS}
        />

        <SelectField
          label="Preferred Marital Status"
          options={MARITAL_STATUS}
        />

        <InputField
          label="Preferred Religion"
          placeholder="Enter Religion"
        />

        <InputField
          label="Preferred Caste"
          placeholder="Enter Caste"
        />

        <InputField
          label="Preferred Education"
          placeholder="Enter Education"
        />

        <InputField
          label="Preferred Occupation"
          placeholder="Enter Occupation"
        />

        <InputField
          label="Preferred Country"
          placeholder="Enter Country"
        />

        <InputField
          label="Preferred State / Province"
          placeholder="Enter State"
        />

        <InputField
          label="Preferred City"
          placeholder="Enter City"
        />

        <SelectField
          label="Manglik Preference"
          options={MANGLIK_OPTIONS}
        />
      </div>
    </div>
  );
}