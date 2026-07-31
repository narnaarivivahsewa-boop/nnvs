"use client";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";

import { CURRENCIES, EMPLOYMENT_TYPES } from "../../constants";

export default function Step3Education() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Education & Career
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <InputField
          label="Highest Education"
          placeholder="e.g. B.Tech, MBBS, MBA"
          required
        />

        <InputField
          label="Field of Study"
          placeholder="e.g. Computer Science"
        />

        <InputField
          label="College / University"
          placeholder="Enter college or university"
        />

        <InputField
          label="Occupation"
          placeholder="e.g. Software Engineer"
          required
        />

        <InputField
          label="Company / Organization"
          placeholder="Enter company name"
        />

        <SelectField
          label="Employment Type"
          options={EMPLOYMENT_TYPES}
        />

        <InputField
          label="Annual Income"
          type="number"
          placeholder="Enter annual income"
        />

        <SelectField
          label="Currency"
          options={CURRENCIES}
        />

        <InputField
          label="Working Country"
          placeholder="Enter working country"
        />

        <InputField
          label="Working State / Province"
          placeholder="Enter working state"
        />

        <InputField
          label="Working City"
          placeholder="Enter working city"
        />
      </div>
    </div>
  );
}