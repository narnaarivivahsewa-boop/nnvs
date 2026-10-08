"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const totalSteps = 5;

  const [step, setStep] = useState(1);

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [maskedMobile, setMaskedMobile] = useState("");
  const [otpStatus, setOtpStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  // Resend OTP countdown effect
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Duplicate Modal
  const [duplicateModal, setDuplicateModal] = useState<{
    open: boolean;
    maskedMobile?: string;
    message: string;
  }>({
    open: false,
    message: "",
  });

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    control,
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
      religion: "Hindu",
      caste: "",
      motherTongue: "",
      country: "India",
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
      preferredReligion: "Open to All",
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
    setResendTimer(0);
    setOtpStatus({ type: null, message: "" });
  };

  const sendOTP = async () => {
    const mobile = getValues("mobile")?.trim();
    const email = getValues("email")?.trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setOtpStatus({
        type: "error",
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
      return;
    }

    if (!email) {
      setOtpStatus({
        type: "error",
        message: "Please enter your email address first.",
      });
      return;
    }

    try {
      setOtpLoading(true);
      setOtpStatus({ type: "info", message: "Checking email and sending SMS OTP..." });

      // Check Email First
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
        setOtpStatus({
          type: "error",
          message: emailResult.message || "Email check failed.",
        });
        return;
      }

      // Send OTP via 2Factor backend
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
        if (result.cooldownRemaining) {
          setResendTimer(result.cooldownRemaining);
        }
        setOtpStatus({
          type: "error",
          message: result.message || "Failed to send SMS OTP.",
        });
        return;
      }

      setOtpSent(true);
      setMaskedMobile(result.maskedMobile || mobile);
      setResendTimer(90); // 90s cooldown
      setOtpStatus({
        type: "success",
        message: result.message || `OTP sent to ${result.maskedMobile || mobile} via SMS.`,
      });
    } catch (err) {
      console.error(err);
      setOtpStatus({
        type: "error",
        message: "Network error. Unable to reach SMS gateway.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    const mobile = getValues("mobile")?.trim();

    if (otp.length !== 6) {
      setOtpStatus({
        type: "error",
        message: "Please enter the full 6-digit OTP code.",
      });
      return;
    }

    try {
      setOtpLoading(true);
      setOtpStatus({ type: "info", message: "Verifying OTP..." });

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
        setOtpStatus({
          type: "error",
          message: result.message || "OTP verification failed.",
        });
        return;
      }

      setOtpVerified(true);
      setOtpStatus({
        type: "success",
        message: "Mobile number verified successfully! ✓ You can now continue with your registration.",
      });
    } catch (err) {
      console.error(err);
      setOtpStatus({
        type: "error",
        message: "OTP verification failed due to network error.",
      });
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
        if (result.isDuplicate) {
          setDuplicateModal({
            open: true,
            maskedMobile: result.maskedMobile,
            message:
              result.message ||
              `You have already registered with RishteClub using mobile number ${result.maskedMobile}. Please login using your existing registered mobile number.`,
          });
          return;
        }

        alert(result.message || "Registration could not be completed.");
        return;
      }

      alert("Registration Successful ✅");

      router.push(
        `/payment?profileId=${encodeURIComponent(
          result.profileId
        )}&name=${encodeURIComponent(data.fullName)}&gender=${encodeURIComponent(data.gender)}`
      );
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

        <p className="mb-8 mt-3 text-center text-gray-500 text-sm">
          Fill your matrimonial biodata below. Registration Fee: Female ₹399 + GST | Male ₹799 + GST (payable after submission).
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
              resendTimer={resendTimer}
              maskedMobile={maskedMobile}
              otpStatus={otpStatus}
              onSendOTP={sendOTP}
              onVerifyOTP={verifyOTP}
              onChangeMobile={changeMobile}
            />
          )}

          {step === 2 && (
            <Step2Personal
              register={register}
              errors={errors}
              control={control}
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
              control={control}
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

      {/* Duplicate Registration Warning Modal */}
      {duplicateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-4">
              <span className="text-2xl font-bold">!</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              Existing Account Found
            </h2>

            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              {duplicateModal.message}
            </p>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full rounded-xl bg-[#4A121A] py-3.5 text-sm font-bold text-white shadow hover:bg-[#380C13] transition"
              >
                Login with Registered Mobile
              </button>

              <button
                type="button"
                onClick={() => setDuplicateModal({ open: false, message: "" })}
                className="w-full rounded-xl border border-gray-300 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}