"use client";

import { useMemo } from "react";
import { FieldErrors, UseFormRegister, Control, useWatch } from "react-hook-form";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import {
  HEIGHTS,
  MARITAL_STATUS,
  MANGLIK_OPTIONS,
} from "../../constants";
import { RELIGIONS, getCommunitiesForReligion } from "@/lib/constants/communities";
import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  control: Control<RegisterFormData>;
};

export default function Step4Preference({
  register,
  errors,
  control,
}: Props) {
  const selectedPrefReligion = useWatch({ control, name: "preferredReligion" });

  const dynamicPrefCommunities = useMemo(() => {
    return getCommunitiesForReligion(selectedPrefReligion).filter(
      (c) => !c.startsWith("All ")
    );
  }, [selectedPrefReligion]);

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

        {/* Preferred Religion */}
        <SelectField
          label="Preferred Religion"
          options={["Open to All", ...RELIGIONS]}
          registration={register("preferredReligion")}
          error={errors.preferredReligion}
        />

        {/* Preferred Caste with dynamic list */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Preferred Caste {selectedPrefReligion ? `(${selectedPrefReligion})` : ""}
          </label>
          <input
            list="pref-castes-list"
            type="text"
            placeholder="e.g. Any, Open to All, Jat, Brahmin, Agarwal..."
            {...register("preferredCaste")}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-red-900 focus:ring-1 focus:ring-red-900"
          />
          <datalist id="pref-castes-list">
            <option value="Open to All / No Caste Bar" />
            {dynamicPrefCommunities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {errors.preferredCaste && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {errors.preferredCaste.message}
            </p>
          )}
        </div>

        <InputField
          label="Preferred Education"
          placeholder="e.g. B.Tech, MBA, MBBS, Graduate"
        />

        <InputField
          label="Preferred Occupation"
          placeholder="e.g. Software Engineer, Doctor, CA, Business"
        />

        <InputField
          label="Preferred Country"
          placeholder="e.g. India"
        />

        <InputField
          label="Preferred State"
          placeholder="e.g. Delhi NCR, Haryana, Punjab, UP"
        />

        <InputField
          label="Preferred City"
          placeholder="e.g. Delhi, Gurgaon, Chandigarh"
        />

        <SelectField
          label="Manglik Preference"
          options={MANGLIK_OPTIONS}
        />
      </div>
    </div>
  );
}