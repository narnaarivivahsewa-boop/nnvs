"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";

import {
  CURRENCIES,
  EMPLOYMENT_TYPES,
} from "../../constants";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function Step3Education({
  register,
  errors,
}: Props) {
  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold text-gray-800">
        Education & Career
      </h2>

      <div className="grid md:grid-cols-2 gap-6">

        <InputField
          label="Highest Education"
          placeholder="e.g. B.Tech, MBA"
          required
          registration={register("highestQualification")}
          error={errors.highestQualification}
        />

        <InputField
          label="Field of Study"
          placeholder="Computer Science"
          registration={register("occupationField")}
          error={errors.occupationField}
        />

        <InputField
          label="College / University"
          placeholder="Enter College"
          registration={register("college")}
          error={errors.college}
        />

        <InputField
          label="Profession"
          placeholder="Software Engineer"
          required
          registration={register("profession")}
          error={errors.profession}
        />

        <InputField
          label="Company"
          placeholder="Company Name"
          registration={register("company")}
          error={errors.company}
        />

        <SelectField
          label="Employment Type"
          options={EMPLOYMENT_TYPES}
        />

        <InputField
          label="Annual Income"
          type="number"
          placeholder="Annual Income"
          registration={register("annualIncome")}
          error={errors.annualIncome}
        />

        <SelectField
          label="Currency"
          options={CURRENCIES}
        />

        <InputField
          label="Working Country"
          placeholder="Country"
        />

        <InputField
          label="Working State"
          placeholder="State"
        />

        <InputField
          label="Working City"
          placeholder="City"
        />

      </div>

    </div>
  );
}