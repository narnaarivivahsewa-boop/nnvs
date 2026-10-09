"use client";

import { useState } from "react";
import { CreditCard, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutButtonProps {
  amountInRupees: number; // e.g. 470.82 or 399
  profileId?: string;
  name?: string;
  email?: string;
  mobile?: string;
  description?: string;
  promoCode?: string;
  className?: string;
  buttonText?: string;
  onSuccess?: (verificationResult: any) => void;
  onFailure?: (error: any) => void;
}

export default function RazorpayCheckoutButton({
  amountInRupees,
  profileId,
  name = "",
  email = "",
  mobile = "",
  description = "Matrimony Registration & Membership Fee",
  promoCode,
  className = "",
  buttonText,
  onSuccess,
  onFailure,
}: RazorpayCheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Ensure Razorpay SDK script is loaded
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error(
          "Unable to load Razorpay Payment Gateway. Please check your internet connection."
        );
      }

      // Convert rupees to paise (e.g. ₹470.82 -> 47082 paise)
      const amountInPaise = Math.round(amountInRupees * 100);

      // 2. Call backend /api/create-order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${profileId || "nnvs"}_${Date.now()}`,
          notes: {
            profileId: profileId || "N/A",
            customerName: name || "Member",
            customerMobile: mobile || "N/A",
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to initiate payment order.");
      }

      const keyId =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_test_Tlnas3wt7K4UPo";

      // 3. Configure Razorpay Standard Checkout Options
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "RishteClub Matrimony",
        description: description,
        image: "/nnvs-logo.png",
        order_id: orderData.order_id || orderData.id,
        prefill: {
          name: name || undefined,
          email: email || undefined,
          contact: mobile ? (mobile.startsWith("+91") ? mobile : `+91${mobile}`) : undefined,
        },
        theme: {
          color: "#4A121A", // Brand Burgundy
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMessage("Payment was cancelled or closed before completion.");
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setLoading(true);
            setErrorMessage("");
            // 4. Send response to backend verification endpoint
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                profileId: profileId,
                promoCode: promoCode,
                amount: orderData.amount,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(
                verifyData.message || "Payment signature verification failed."
              );
            }

            setSuccessMessage("Payment verified successfully! Redirecting...");

            if (onSuccess) {
              onSuccess(verifyData);
            } else {
              setTimeout(() => {
                if (verifyData.invoiceUrl) {
                  router.push(verifyData.invoiceUrl);
                } else if (profileId) {
                  router.push(`/dashboard?payment=success&profileId=${profileId}`);
                } else {
                  router.push("/dashboard?payment=success");
                }
              }, 1200);
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            const msg = err?.message || "Payment verification failed.";
            setErrorMessage(msg);
            if (onFailure) onFailure(err);
          } finally {
            setLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Handle payment failure event
      razorpayInstance.on("payment.failed", function (response: any) {
        console.error("Razorpay Payment Failed:", response.error);
        setErrorMessage(
          response.error?.description ||
            "Payment failed. Please try again with a different payment method."
        );
        setLoading(false);
        if (onFailure) onFailure(response.error);
      });

      razorpayInstance.open();
    } catch (error: any) {
      console.error("Checkout initiation error:", error);
      setErrorMessage(error?.message || "Something went wrong while initiating checkout.");
      setLoading(false);
      if (onFailure) onFailure(error);
    }
  };

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || amountInRupees <= 0}
        className={
          className ||
          "w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#4A121A] hover:bg-[#3A0C13] py-3.5 px-5 text-white font-bold shadow-lg transition text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        }
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-[#DFBA73]" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 text-[#DFBA73]" />
            <span>
              {buttonText ||
                `Pay ₹${amountInRupees.toFixed(2)} with Razorpay (UPI / Cards / Netbanking)`}
            </span>
          </>
        )}
      </button>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}
