"use client";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import TextareaField from "../form/TextareaField";

import {
  FAMILY_TYPES,
  FAMILY_VALUES,
} from "../../constants";

export default function Step5Family() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Family & Profile
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <InputField
          label="Father's Name"
          placeholder="Enter father's name"
        />

        <InputField
          label="Mother's Name"
          placeholder="Enter mother's name"
        />

        <SelectField
          label="Family Type"
          options={FAMILY_TYPES}
        />

        <SelectField
          label="Family Values"
          options={FAMILY_VALUES}
        />

        <InputField
          label="Number of Brothers"
          type="number"
          min={0}
        />

        <InputField
          label="Number of Sisters"
          type="number"
          min={0}
        />
      </div>

      <TextareaField
        label="About Yourself"
        placeholder="Tell us something about yourself..."
        rows={5}
      />

      <div>
        <label className="block mb-2 font-medium text-gray-700">
          Profile Photos
        </label>

        <input
          type="file"
          accept="image/*"
          multiple
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition-all duration-200 focus:border-red-700 focus:ring-2 focus:ring-red-100"
        />

        <p className="mt-2 text-sm text-gray-500">
          Upload one or more profile photos (JPG, PNG, WEBP).
        </p>
      </div>
    </div>
  );
}