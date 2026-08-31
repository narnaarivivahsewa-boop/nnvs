"use client";

import { useMemo } from "react";
import { FieldErrors, UseFormRegister, Control, useWatch } from "react-hook-form";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import {
  GENDERS,
  LOOKING_FOR,
  MARITAL_STATUS,
  HEIGHTS,
} from "../../constants";
import { RELIGIONS, getCommunitiesForReligion } from "@/lib/constants/communities";
import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  control: Control<RegisterFormData>;
};

export default function Step2Personal({
  register,
  errors,
  control,
}: Props) {
  const selectedReligion = useWatch({ control, name: "religion" });

  const dynamicCommunities = useMemo(() => {
    return getCommunitiesForReligion(selectedReligion).filter(
      (c) => !c.startsWith("All ")
    );
  }, [selectedReligion]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Personal & Community Details
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
          placeholder="Enter weight in kg (e.g. 65)"
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

        {/* Religion Select */}
        <SelectField
          label="Religion"
          options={RELIGIONS}
          required
          registration={register("religion")}
          error={errors.religion}
        />

        {/* Caste / Community Input with dynamic Datalist mapped to selected religion */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Caste / Community {selectedReligion ? `(${selectedReligion})` : ""}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            list="castes-list"
            type="text"
            placeholder={
              selectedReligion
                ? `Select or Type ${selectedReligion} Caste (e.g. ${
                    dynamicCommunities[0] || "Caste"
                  }...)`
                : "Select Religion first or Type Caste..."
            }
            {...register("caste", { required: "Caste/Community is required" })}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-red-900 focus:ring-1 focus:ring-red-900"
          />
          <datalist id="castes-list">
            {dynamicCommunities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {errors.caste && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {errors.caste.message}
            </p>
          )}
        </div>

        <InputField
          label="Mother Tongue"
          placeholder="e.g. Hindi, Punjabi, Haryanvi, English"
          registration={register("motherTongue")}
          error={errors.motherTongue}
        />

        <InputField
          label="Country"
          placeholder="Enter Country (e.g. India)"
          required
          registration={register("country")}
          error={errors.country}
        />

        <InputField
          label="State / Province"
          placeholder="e.g. Delhi, Haryana, Punjab, Rajasthan, UP"
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