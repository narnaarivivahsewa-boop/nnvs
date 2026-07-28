"use client";

import { useState } from "react";

import ProgressBar from "./components/ProgressBar";
import NavigationButtons from "./components/NavigationButtons";

export default function RegisterPage() {
  const totalSteps = 5;
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      alert("Registration Submitted");
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 md:p-10">
        <h1 className="text-4xl font-bold text-center text-red-800">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mt-3 mb-8">
          Join Nar Naari Vivah Sewa (NNVS)
        </p>

        <ProgressBar
          step={step}
          totalSteps={totalSteps}
        />

        <div className="min-h-[420px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl">
          <h2 className="text-2xl font-semibold text-gray-500">
            Step {step} Content Here
          </h2>
        </div>

        <NavigationButtons
          step={step}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    </div>
  );
}