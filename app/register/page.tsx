"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, AlertCircle } from "lucide-react";

import ProgressBar from "./components/ProgressBar";
import NavigationButtons from "./components/NavigationButtons";
import ErrorToast from "@/components/ui/ErrorToast";

import Step1Account from "./components/steps/Step1Account";
import Step2Personal from "./components/steps/Step2Personal";
import Step3Education from "./components/steps/Step3Education";
import Step4Preference from "./components/steps/Step4Preference";
import Step5Family from "./components/steps/Step5Family";

import { registerSchema } from "./schema";
import { RegisterFormData } from "@/types/register";
import {
  saveRegistrationVerification,
  getRegistrationVerification,
  clearRegistrationVerification,
} from "@/lib/auth/registration-storage";
import { saveAuthSession } from "@/lib/auth/session-storage";
import { getRegistrationPricingDetails } from "@/lib/pricing";
import {
  DEFAULT_API_TIMEOUT_MS,
  fetchWithTimeout,
  getFriendlyFetchErrorMessage,
  safeParseJson,
} from "@/lib/fetch-with-timeout";

const STEP_FIELD_MAP: Record<number, (keyof RegisterFormData)[]> = {
  1: ["fullName", "mobile", "email", "profileType", "password", "confirmPassword"],
  2: [
    "gender",
    "lookingFor",
    "dateOfBirth",
    "height",
    "maritalStatus",
    "caste",
    "country",
    "state",
    "city",
  ],
  3: ["highestQualification", "profession"],
  4: ["minAge", "maxAge", "minHeight", "maxHeight", "preferredReligion", "preferredCaste"],
  5: ["fatherName", "motherName", "brothers", "sisters", "familyType", "familyStatus", "photos"],
};

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalSteps = 5;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastError, setToastError] = useState<string | null>(null);

  const dismissToastError = useCallback(() => {
    setToastError(null);
  }, []);

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpActionInFlightRef = useRef(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [maskedMobile, setMaskedMobile] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
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

  // Close duplicate modal on Escape
  useEffect(() => {
    if (!duplicateModal.open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDuplicateModal((prev) => ({ ...prev, open: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duplicateModal.open]);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    setError,
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

  // Keep react-hook-form photos field synchronized with uploaded photos array
  useEffect(() => {
    setValue("photos", photos, { shouldValidate: step === 5 });
  }, [photos, setValue, step]);

  // Restore mobile / verified OTP state from URL query params (AuthModal, Login, Kundli) or localStorage
  useEffect(() => {
    const rawParamMobile =
      searchParams.get("mobile") || searchParams.get("phone") || "";
    const cleanParamMobile = rawParamMobile.replace(/\D/g, "").slice(-10);
    const stored = getRegistrationVerification(cleanParamMobile || undefined);

    const targetMobile = /^[6-9]\d{9}$/.test(cleanParamMobile)
      ? cleanParamMobile
      : stored?.mobile || "";

    if (!/^[6-9]\d{9}$/.test(targetMobile)) return;

    setValue("mobile", targetMobile, { shouldValidate: true });

    let cancelled = false;
    const unmountController = new AbortController();
    async function confirmServerVerification() {
      try {
        const res = await fetchWithTimeout(
          `/api/auth/verify-otp?mobile=${encodeURIComponent(targetMobile)}`,
          {
            method: "GET",
            headers: stored?.token ? { "x-reg-token": stored.token } : undefined,
            cache: "no-store",
            credentials: "include",
            signal: unmountController.signal,
            timeoutMs: DEFAULT_API_TIMEOUT_MS,
          }
        );

        const data = await safeParseJson<{
          alreadyRegistered?: boolean;
          message?: string;
          verified?: boolean;
          registrationToken?: string;
        }>(res);
        if (cancelled) return;

        if (data.alreadyRegistered) {
          setOtpStatus({
            type: "error",
            message:
              data.message ||
              "This mobile number is already registered. Please proceed to login.",
          });
          return;
        }

        if (res.ok && data.verified) {
          const activeToken = data.registrationToken || stored?.token || "";
          setOtpVerified(true);
          setOtpSent(false);
          setRegistrationToken(activeToken);
          saveRegistrationVerification(targetMobile, activeToken);
          setOtpStatus({
            type: "success",
            message: `Mobile number +91 ${targetMobile} is verified! ✓ Complete the remaining details below and click Next.`,
          });
        }
      } catch {
        // Silent fallback — user can verify directly on Step 1
      }
    }

    confirmServerVerification();

    return () => {
      cancelled = true;
      unmountController.abort();
    };
  }, [searchParams, setValue]);

  const changeMobile = () => {
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    setRegistrationToken("");
    setResendTimer(0);
    setToastError(null);
    setOtpStatus({ type: null, message: "" });
    clearRegistrationVerification();
  };

  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return true;

    try {
      const emailRes = await fetchWithTimeout("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmedEmail }),
        timeoutMs: DEFAULT_API_TIMEOUT_MS,
      });
      const emailResult = await safeParseJson<{ message?: string }>(emailRes);

      if (!emailRes.ok) {
        const msg = emailResult.message || "Email is already registered.";
        setError("email", { type: "manual", message: msg });
        setFormError(msg);
        if (!otpVerified) {
          setOtpStatus({ type: "error", message: msg });
        }
        setToastError(msg);
        return false;
      }

      return true;
    } catch (err) {
      const msg = getFriendlyFetchErrorMessage(
        err,
        "Unable to verify email availability right now. Please try again."
      );
      setFormError(msg);
      if (!otpVerified) {
        setOtpStatus({ type: "error", message: msg });
      }
      setToastError(msg);
      return false;
    }
  };

  const sendOTP = async () => {
    if (otpActionInFlightRef.current || otpLoading) return;

    setFormError("");
    setToastError(null);
    const mobile =
      String(getValues("mobile") ?? "")
        .trim()
        .replace(/\D/g, "")
        .slice(-10);
    const email = String(getValues("email") ?? "").trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setOtpStatus({
        type: "error",
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
      return;
    }

    setValue("mobile", mobile, { shouldValidate: true });

    try {
      otpActionInFlightRef.current = true;
      setOtpLoading(true);
      setOtpStatus({ type: "info", message: "Sending SMS OTP..." });

      // Pre-check Email if user already entered it
      if (email) {
        const emailAvailable = await checkEmailAvailability(email);
        if (!emailAvailable) return;
      }

      // Send OTP via Fast2SMS backend
      const res = await fetchWithTimeout("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          mobile,
          type: "REGISTRATION",
        }),
        timeoutMs: DEFAULT_API_TIMEOUT_MS,
      });

      const result = await safeParseJson<{
        success?: boolean;
        cooldownRemaining?: number;
        message?: string;
        maskedMobile?: string;
      }>(res);

      if (!res.ok || result.success === false) {
        if (result.cooldownRemaining) {
          setResendTimer(result.cooldownRemaining);
        }
        const msg = result.message || "Failed to send SMS OTP.";
        setOtpStatus({
          type: "error",
          message: msg,
        });
        setToastError(msg);
        return;
      }

      setOtpSent(true);
      setMaskedMobile(result.maskedMobile || mobile);
      setResendTimer(60); // 60s cooldown
      setOtpStatus({
        type: "success",
        message:
          result.message || `OTP sent to ${result.maskedMobile || mobile} via SMS.`,
      });
    } catch (err) {
      console.error(err);
      const msg = getFriendlyFetchErrorMessage(
        err,
        "Network error. Unable to reach SMS gateway."
      );
      setOtpStatus({
        type: "error",
        message: msg,
      });
      setToastError(msg);
    } finally {
      otpActionInFlightRef.current = false;
      setOtpLoading(false);
    }
  };

  const resendOTP = async () => {
    if (otpActionInFlightRef.current || otpLoading) return;

    setFormError("");
    setToastError(null);
    const mobile =
      String(getValues("mobile") ?? "")
        .trim()
        .replace(/\D/g, "")
        .slice(-10);
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setOtpStatus({
        type: "error",
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
      return;
    }

    setValue("mobile", mobile, { shouldValidate: true });

    try {
      otpActionInFlightRef.current = true;
      setOtpLoading(true);
      setOtpStatus({ type: "info", message: "Resending SMS OTP..." });

      const res = await fetchWithTimeout("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mobile,
          type: "REGISTRATION",
        }),
        timeoutMs: DEFAULT_API_TIMEOUT_MS,
      });

      const result = await safeParseJson<{
        success?: boolean;
        cooldownRemaining?: number;
        message?: string;
      }>(res);

      if (!res.ok || result.success === false) {
        if (result.cooldownRemaining) {
          setResendTimer(result.cooldownRemaining);
        }
        const msg = result.message || "Failed to resend SMS OTP.";
        setOtpStatus({
          type: "error",
          message: msg,
        });
        setToastError(msg);
        return;
      }

      setResendTimer(60);
      setOtpStatus({
        type: "success",
        message:
          result.message || "OTP resent successfully via Fast2SMS SMS.",
      });
    } catch (err) {
      console.error(err);
      const msg = getFriendlyFetchErrorMessage(
        err,
        "Network error. Unable to reach SMS gateway."
      );
      setOtpStatus({
        type: "error",
        message: msg,
      });
      setToastError(msg);
    } finally {
      otpActionInFlightRef.current = false;
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otpActionInFlightRef.current || otpLoading) return;

    setFormError("");
    setToastError(null);
    const mobile =
      String(getValues("mobile") ?? "")
        .trim()
        .replace(/\D/g, "")
        .slice(-10);
    const cleanOtp = String(otp ?? "").trim().replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setOtpStatus({
        type: "error",
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
      return;
    }

    if (!/^\d{4,6}$/.test(cleanOtp)) {
      setOtpStatus({
        type: "error",
        message: "Please enter the valid 4 to 6 digit OTP received via SMS.",
      });
      return;
    }

    setValue("mobile", mobile, { shouldValidate: true });

    try {
      otpActionInFlightRef.current = true;
      setOtpLoading(true);
      setOtpStatus({ type: "info", message: "Verifying OTP..." });

      const res = await fetchWithTimeout("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          mobile,
          otp: cleanOtp,
          type: "REGISTRATION",
        }),
        timeoutMs: DEFAULT_API_TIMEOUT_MS,
      });

      const result = await safeParseJson<{
        success?: boolean;
        message?: string;
        registrationToken?: string;
      }>(res);

      if (!res.ok || result.success === false) {
        const msg = result.message || "OTP verification failed.";
        setOtpStatus({
          type: "error",
          message: msg,
        });
        setToastError(msg);
        return;
      }

      // Persist registration verification token before state transition
      const verifiedToken = result.registrationToken || "";
      setRegistrationToken(verifiedToken);
      saveRegistrationVerification(mobile, verifiedToken);

      setOtpVerified(true);
      setOtpSent(false);

      // Check if remaining Step 1 fields are filled & valid to transition straight to Step 2
      const values = getValues();
      const hasAllStep1Inputs =
        values.fullName.trim().length > 0 &&
        values.email.trim().length > 0 &&
        values.password.length > 0 &&
        values.confirmPassword.length > 0;

      if (hasAllStep1Inputs) {
        const step1Valid = await trigger([
          "fullName",
          "mobile",
          "email",
          "password",
          "confirmPassword",
          "profileType",
        ]);

        if (step1Valid) {
          const emailOk = await checkEmailAvailability(values.email);
          if (emailOk) {
            setOtpStatus({
              type: "success",
              message: "Mobile number verified successfully! ✓ Moving to Step 2...",
            });
            setStep(2);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          return;
        }
      }

      setOtpStatus({
        type: "success",
        message:
          "Mobile number verified successfully! ✓ Complete any remaining fields below and click Next to continue.",
      });
    } catch (err) {
      console.error(err);
      const msg = getFriendlyFetchErrorMessage(
        err,
        "OTP verification failed due to network error."
      );
      setOtpStatus({
        type: "error",
        message: msg,
      });
      setToastError(msg);
    } finally {
      otpActionInFlightRef.current = false;
      setOtpLoading(false);
    }
  };

  const handleNext = async () => {
    setFormError("");
    let valid = true;

    switch (step) {
      case 1: {
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
          const msg = "Please verify your mobile number via SMS OTP first.";
          setOtpStatus({ type: "error", message: msg });
          setFormError(msg);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        const emailAvailable = await checkEmailAvailability(getValues("email"));
        if (!emailAvailable) return;

        break;
      }

      case 2:
        valid = await trigger([
          "gender",
          "lookingFor",
          "dateOfBirth",
          "height",
          "maritalStatus",
          "caste",
          "country",
          "state",
          "city",
        ]);

        if (!valid) {
          setFormError("Please complete all required personal & location details.");
          return;
        }

        break;

      case 3:
        valid = await trigger(["highestQualification", "profession"]);

        if (!valid) return;

        break;

      case 5:
        if (photos.length < 1) {
          setFormError("At least 1 photo is mandatory to create/update profile.");
          return;
        }
        if (photos.length > 3) {
          setFormError("Maximum 3 photos allowed.");
          return;
        }

        break;

      default:
        break;
    }

    if (step < totalSteps) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setFormError("");
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onInvalid = (formErrors: FieldErrors<RegisterFormData>) => {
    const errorKeys = Object.keys(formErrors) as (keyof RegisterFormData)[];
    if (errorKeys.length === 0) return;

    // Locate earliest step containing a validation error
    let targetStep = step;
    for (let s = 1; s <= totalSteps; s++) {
      const stepFields = STEP_FIELD_MAP[s] || [];
      if (errorKeys.some((k) => stepFields.includes(k))) {
        targetStep = s;
        break;
      }
    }

    const firstKey = errorKeys[0];
    const firstMsg =
      formErrors[firstKey]?.message ||
      "Please check highlighted required fields before submitting.";

    setStep(targetStep);
    setFormError(String(firstMsg));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: RegisterFormData) => {
    setFormError("");

    if (!otpVerified) {
      setStep(1);
      const msg = "Please verify your mobile number via SMS OTP first.";
      setOtpStatus({ type: "error", message: msg });
      setFormError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (photos.length < 1) {
      setFormError("At least 1 photo is mandatory to create/update profile.");
      return;
    }
    if (photos.length > 3) {
      setFormError("Maximum 3 photos allowed.");
      return;
    }

    try {
      setIsSubmitting(true);
      setToastError(null);
      const stored = getRegistrationVerification(data.mobile);
      const payload = {
        ...data,
        photos,
        registrationToken: registrationToken || stored?.token || undefined,
      };

      const res = await fetchWithTimeout("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
        timeoutMs: DEFAULT_API_TIMEOUT_MS,
      });

      const result = await safeParseJson<{
        success?: boolean;
        isDuplicate?: boolean;
        maskedMobile?: string;
        message?: string;
        profileId?: string;
        userId?: string;
        activeProfileId?: string;
        token?: string;
      }>(res);

      if (!res.ok || result.success === false) {
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

        const msg = result.message || "Registration could not be completed.";
        setFormError(msg);
        setToastError(msg);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      clearRegistrationVerification();

      if (result.token) {
        await saveAuthSession(result.token, result.activeProfileId || null, {
          userId: result.userId,
          fullName: data.fullName,
          role: "MEMBER",
        });
      }

      router.push(
        `/payment?profileId=${encodeURIComponent(
          result.profileId || ""
        )}&name=${encodeURIComponent(data.fullName)}&gender=${encodeURIComponent(
          data.gender
        )}&mobile=${encodeURIComponent(data.mobile)}`
      );
    } catch (error) {
      console.error(error);
      const msg = getFriendlyFetchErrorMessage(
        error,
        "Something went wrong while submitting registration. Please try again."
      );
      setFormError(msg);
      setToastError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const femalePricing = getRegistrationPricingDetails("FEMALE");
  const malePricing = getRegistrationPricingDetails("MALE");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <ErrorToast
        message={toastError}
        onDismiss={dismissToastError}
        title="Registration Notice"
      />
      <div className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-xl md:p-10">
        <h1 className="text-center text-4xl font-bold text-red-800">
          Complete Your Biodata
        </h1>

        {femalePricing.isOfferActive ? (
          <p className="mb-8 mt-3 text-center text-gray-600 text-sm">
            Fill your matrimonial biodata below.{" "}
            <span className="font-bold text-[#4A121A]">
              Special Launch Offer: Only ₹{femalePricing.baseFee} + GST (₹
              {femalePricing.totalAmount.toFixed(2)}) for Both Brides &amp; Grooms
            </span>{" "}
            <span className="line-through text-gray-400">
              (Regular: Female ₹{femalePricing.regularBaseFee} | Male ₹
              {malePricing.regularBaseFee} + GST)
            </span>{" "}
            • {femalePricing.validityLabel}.
          </p>
        ) : (
          <p className="mb-8 mt-3 text-center text-gray-500 text-sm">
            Fill your matrimonial biodata below. Registration Fee: Female ₹
            {femalePricing.baseFee} + GST | Male ₹{malePricing.baseFee} + GST
            (payable after submission).
          </p>
        )}

        <ProgressBar step={step} totalSteps={totalSteps} />

        {formError && (
          <div
            role="alert"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <span>{formError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormError("")}
              className="text-rose-500 hover:text-rose-800 cursor-pointer shrink-0"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              step < totalSteps &&
              (e.target as HTMLElement).tagName === "INPUT"
            ) {
              e.preventDefault();
            }
          }}
        >
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
              onResendOTP={resendOTP}
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
            <Step3Education register={register} errors={errors} />
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
            isSubmitting={isSubmitting}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        </form>
      </div>

      {/* Duplicate Registration Warning Modal */}
      {duplicateModal.open && (
        <div
          onClick={() => setDuplicateModal({ open: false, message: "" })}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 text-center"
          >
            <button
              type="button"
              onClick={() => setDuplicateModal({ open: false, message: "" })}
              aria-label="Close duplicate account notice"
              className="absolute top-4 right-4 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

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
                className="w-full rounded-xl bg-[#4A121A] py-3.5 text-sm font-bold text-white shadow hover:bg-[#380C13] transition cursor-pointer"
              >
                Login with Registered Mobile
              </button>

              <button
                type="button"
                onClick={() => setDuplicateModal({ open: false, message: "" })}
                className="w-full rounded-xl border border-gray-300 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-10 text-center text-sm font-semibold text-gray-500 shadow-xl">
            Loading registration form...
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
