"use client";

import { SelectHTMLAttributes } from "react";
import { FieldError } from "react-hook-form";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[];
  placeholder?: string;
  error?: FieldError;
};

export default function SelectField({
  label,
  options,
  placeholder = "Select",
  error,
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">
        {label}
        {props.required && (
          <span className="text-red-500"> *</span>
        )}
      </label>

      <select
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition-all duration-200
        ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
            : "border-gray-300 focus:border-red-700 focus:ring-2 focus:ring-red-100"
        }
        ${className}`}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}