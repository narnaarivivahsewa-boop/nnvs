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

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),

    mode: "onTouched",

    defaultValues: {
      fullName: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
      profileType: "Male",

      gender: "",
      lookingFor: "",
      dateOfBirth: "",
      height: "",
      weight: "",
      maritalStatus: "",
      religion: "",
      caste: "",
      motherTongue: "",
      country: "",
      state: "",
      city: "",
      postalCode: "",

      highestQualification: "",
      college: "",
      occupationField: "",
      profession: "",
      company: "",
      annualIncome: "",

      minAge: "",
      maxAge: "",
      minHeight: "",
      maxHeight: "",
      preferredReligion: "",
      preferredCaste: "",

      fatherName: "",
      motherName: "",
      brothers: "",
      sisters: "",
      familyType: "",
      familyStatus: "",

      about: "",
      photos: [],
    },
  });

  const changeMobile = () => {
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
  };

  const sendOTP = async () => {
  const mobile = getValues("mobile");
  const email = getValues("email");

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    alert("Enter valid mobile number.");
    return;
  }

  if (!email) {
    alert("Enter your email address.");
    return;
  }

  try {
    setOtpLoading(true);

    // -------------------------
    // Check Email First
    // -------------------------

    const emailRes = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });

    const emailResult = await emailRes.json();

    if (!emailRes.ok) {
      alert(emailResult.message);
      return;
    }

    // -------------------------
    // Send OTP
    // -------------------------

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile,
        type: "REGISTRATION",
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message);
      return;
    }

    setOtpSent(true);

    alert("OTP Sent Successfully");

  } catch (err) {
    console.error(err);

    alert("Unable to Send OTP");

  } finally {
    setOtpLoading(false);
  }
};

  const verifyOTP = async () => {
    const mobile = getValues("mobile");

    if (otp.length !== 6) {
      alert("Enter 6 Digit OTP");
      return;
    }

    try {
      setOtpLoading(true);

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile,
          otp,
          type: "REGISTRATION",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message);
        return;
      }

      setOtpVerified(true);

      alert("Mobile Verified");
    } catch (err) {
      console.error(err);
      alert("OTP Verification Failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleNext = async () => {
    let valid = true;

    switch (step) {
      case 1:
        valid = await trigger([
          "fullName",
          "mobile",
          "email",
          "password",
          "confirmPassword",
          "profileType",
        ]);

        if (!valid) return;

        if (!otpVerified) {
          alert("Please verify your mobile number first.");
          return;
        }

        break;

      case 2:
        valid = await trigger([
          "gender",
          "lookingFor",
          "dateOfBirth",
          "height",
          "maritalStatus",
          "country",
          "state",
          "city",
        ]);

        if (!valid) return;

        break;

      case 3:
        valid = await trigger([
          "highestQualification",
          "profession",
        ]);

        if (!valid) return;

        break;

      case 5:
        if (photos.length < 1) {
          alert("Please upload at least one profile photo.");
          return;
        }

        break;

      default:
        break;
    }

    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  };
    const handlePrevious = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const payload = {
        ...data,
        photos,
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message);
        return;
      }

      alert("Registration Successful ✅");

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-xl md:p-10">

        <h1 className="text-center text-4xl font-bold text-red-800">
          Complete Your Biodata
        </h1>

        <p className="mb-8 mt-3 text-center text-gray-500">
          Let's create your matrimonial profile
        </p>

        <ProgressBar
          step={step}
          totalSteps={totalSteps}
        />

        <form onSubmit={handleSubmit(onSubmit)}>

          {step === 1 && (
            <Step1Account
              register={register}
              errors={errors}
              otp={otp}
              setOtp={setOtp}
              otpSent={otpSent}
              otpVerified={otpVerified}
              otpLoading={otpLoading}
              onSendOTP={sendOTP}
              onVerifyOTP={verifyOTP}
              onChangeMobile={changeMobile}
            />
          )}

          {step === 2 && (
            <Step2Personal
              register={register}
              errors={errors}
            />
          )}

          {step === 3 && (
            <Step3Education
              register={register}
              errors={errors}
            />
          )}

          {step === 4 && (
            <Step4Preference
              register={register}
              errors={errors}
            />
          )}

          {step === 5 && (
            <Step5Family
              register={register}
              errors={errors}
              photos={photos}
              setPhotos={setPhotos}
              uploading={uploading}
              setUploading={setUploading}
            />
          )}

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