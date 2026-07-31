"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import ProgressBar from "./components/ProgressBar";
import NavigationButtons from "./components/NavigationButtons";

import Step1Account from "./components/steps/Step1Account";
import Step2Personal from "./components/steps/Step2Personal";
import Step3Education from "./components/steps/Step3Education";
import Step4Preference from "./components/steps/Step4Preference";
import Step5Family from "./components/steps/Step5Family";

import { registerSchema } from "./schema";
import { RegisterFormData } from "@/types/register";

export default function RegisterPage() {
  const totalSteps = 5;
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
   defaultValues: {
  fullName: "",
  mobile: "",
  email: "",
  profileType: "Male",
  password: "",
  confirmPassword: "",
},
  });

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const onSubmit = (data: RegisterFormData) => {
    console.log(data);
    alert("Registration Successful");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-8 md:p-10">
        <h1 className="text-4xl font-bold text-center text-red-800">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mt-3 mb-8">
          Join Nar Naari Vivah Sewa (NNVS)
        </p>

        <ProgressBar step={step} totalSteps={totalSteps} />

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <Step1Account
              register={register}
              errors={errors}
            />
          )}

          {step === 2 && <Step2Personal />}

          {step === 3 && <Step3Education />}

          {step === 4 && <Step4Preference />}

          {step === 5 && <Step5Family />}

          <NavigationButtons
            step={step}
            totalSteps={totalSteps}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        </form>
      </div>
    </div>
  );
}