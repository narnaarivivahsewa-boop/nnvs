"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { BUSINESS_INFO, calculateGstBreakdown } from "@/lib/gst";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";
import {
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Lock,
  Zap,
  FileText,
  BadgeCheck,
} from "lucide-react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId") || "";
  const nameParam = searchParams.get("name") || "";
  const mobileParam = searchParams.get("mobile") || "";
  const genderParam = searchParams.get("gender")?.toUpperCase();

  const isFemale = genderParam === "FEMALE";
  const defaultFee = isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male;

  const [userMobile, setUserMobile] = useState(mobileParam);
  const [userName, setUserName] = useState(nameParam);
  const [settings, setSettings] = useState<{
    registrationFee: number;
    gstPercentage: number;
    tradeName: string;
    gstin: string;
  }>({
    registrationFee: defaultFee,
    gstPercentage: 18,
    tradeName: BUSINESS_INFO.tradeName,
    gstin: BUSINESS_INFO.gstin,
  });

  useEffect(() => {
    async function loadSettingsAndUser() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings({
            registrationFee: Number(data.settings.registrationFee || defaultFee),
            gstPercentage: Number(data.settings.gstPercentage || 18),
            tradeName: data.settings.tradeName || BUSINESS_INFO.tradeName,
            gstin: data.settings.gstin || BUSINESS_INFO.gstin,
          });
        }
      } catch (err) {
        console.error("Error loading payment settings:", err);
      }

      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.success && meData.user) {
          if (!userMobile && meData.user.mobile) {
            setUserMobile(meData.user.mobile);
          }
          if (!userName && meData.user.fullName) {
            setUserName(meData.user.fullName);
          }
        }
      } catch (err) {
        console.error("Error loading current member details:", err);
      }
    }
    loadSettingsAndUser();
  }, [defaultFee, userMobile, userName]);

  const taxes = calculateGstBreakdown(settings.registrationFee);
  const totalAmount = taxes.totalAmount;

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#DACBB4]">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block mb-3">
            <img
              src="/nnvs-logo.png"
              alt="RishteClub Matrimony"
              className="h-14 w-auto mx-auto object-contain"
            />
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF5EB] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7A5835] mb-2.5 border border-[#E8DCC8]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Official Membership Checkout</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A121A] font-serif-luxury tracking-tight">
            Online Registration Fee
          </h1>

          <p className="mt-1 text-xs text-[#7A5835] font-semibold">
            Fast, secure and automated payment via Razorpay Gateway
          </p>
        </div>

        {/* Profile Details Tag */}
        {profileId && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#FAF6EF] px-5 py-3 border border-[#E8DCC8] text-xs">
            <span className="text-gray-600 font-medium">Candidate Profile ID:</span>
            <span className="font-mono font-bold text-[#4A121A] text-sm">{profileId}</span>
          </div>
        )}

        {/* Amount & GST Card */}
        <div className="rounded-2xl border border-[#E8DCC8] bg-[#FAF8F5] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC8]">
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide">
              Applicable Membership Fee
            </h2>
            <span className="text-[11px] font-mono font-bold bg-[#4A121A] text-[#DFBA73] px-2.5 py-0.5 rounded-md">
              SAC: {BUSINESS_INFO.sacCode}
            </span>
          </div>

          <div className="space-y-2.5 pt-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Registration Service Fee</span>
              <span className="font-semibold text-gray-900">
                ₹{settings.registrationFee.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-xs text-gray-600">
              <span>CGST (9%)</span>
              <span>₹{taxes.cgstAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs text-gray-600">
              <span>SGST (9%)</span>
              <span>₹{taxes.sgstAmount.toFixed(2)}</span>
            </div>

            <div className="border-t border-[#E8DCC8] pt-2.5 flex justify-between text-lg font-black text-[#4A121A]">
              <span>Total Amount (incl. 18% GST)</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Instant Razorpay Online Checkout Action Box */}
        <div className="mt-6 rounded-2xl border-2 border-[#4A121A] bg-[#FAF5EB] p-6 shadow-md space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#4A121A] border border-[#DACBB4]">
            <Zap className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Instant Auto-Activation</span>
          </div>

          <div>
            <h3 className="text-base font-bold text-[#4A121A]">
              Pay ₹{totalAmount.toFixed(2)} Online
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Supports UPI (GPay, PhonePe, Paytm), Debit/Credit Cards & Net Banking
            </p>
          </div>

          <RazorpayCheckoutButton
            amountInRupees={totalAmount}
            profileId={profileId}
            name={userName || nameParam}
            mobile={userMobile || mobileParam}
            description="RishteClub Matrimonial Membership Fee"
            buttonText={`Pay ₹${totalAmount.toFixed(2)} with Razorpay`}
          />

          {/* Supported Methods Icons/Labels */}
          <div className="pt-2 border-t border-[#E8DCC8] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold text-gray-600">
            <span className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-[#C5A059]" /> Google Pay / PhonePe / Paytm
            </span>
            <span className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-[#C5A059]" /> Visa / Mastercard / RuPay
            </span>
            <span className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-[#C5A059]" /> Net Banking
            </span>
          </div>
        </div>

        {/* Features / Benefits */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 rounded-xl bg-white p-3.5 border border-[#E8DCC8]">
            <Lock className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">256-bit Bank Encryption</p>
              <p className="text-gray-500 text-[11px]">PCI-DSS Compliant Secure Gateway</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-white p-3.5 border border-[#E8DCC8]">
            <FileText className="h-4 w-4 text-[#4A121A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Instant GST Invoice</p>
              <p className="text-gray-500 text-[11px]">Auto-generated tax invoice on completion</p>
            </div>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        {/* GST Billing Entity Notice */}
        <div className="mt-6 rounded-2xl bg-[#FAF5EB] p-4 text-[11px] text-gray-600 border border-[#DACBB4] space-y-1">
          <div className="flex items-center gap-1.5 text-[#7A5835] font-bold">
            <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
            <span>GST Compliance & Official Billing</span>
          </div>
          <p>
            Official GST Tax Invoice will be issued under trade name <strong>{settings.tradeName}</strong> (GSTIN: <span className="font-mono">{settings.gstin}</span>) upon successful payment.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-[#FAF6EF] px-4 py-12 flex items-center justify-center">
      <Suspense
        fallback={
          <div className="text-center py-20 text-gray-500 font-semibold">
            Loading payment options...
          </div>
        }
      >
        <PaymentContent />
      </Suspense>
    </main>
  );
}