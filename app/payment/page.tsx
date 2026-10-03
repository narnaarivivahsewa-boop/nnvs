"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { BUSINESS_INFO, calculateGstBreakdown } from "@/lib/gst";
import {
  ShieldCheck,
  Sparkles,
  QrCode,
  Copy,
  Check,
  MessageCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId") || "";
  const nameParam = searchParams.get("name") || "";
  const genderParam = searchParams.get("gender")?.toUpperCase();

  const isFemale = genderParam === "FEMALE";
  const defaultFee = isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male;

  const [settings, setSettings] = useState<{
    registrationFee: number;
    gstPercentage: number;
    qrCodeUrl: string;
    qrUpiId: string;
    whatsappNumber: string;
    tradeName: string;
    gstin: string;
  }>({
    registrationFee: defaultFee,
    gstPercentage: 18,
    qrCodeUrl: BUSINESS_INFO.qrCodeUrl,
    qrUpiId: BUSINESS_INFO.upiId,
    whatsappNumber: BUSINESS_INFO.primaryWhatsApp,
    tradeName: BUSINESS_INFO.tradeName,
    gstin: BUSINESS_INFO.gstin,
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings({
            registrationFee: Number(data.settings.registrationFee || defaultFee),
            gstPercentage: Number(data.settings.gstPercentage || 18),
            qrCodeUrl: data.settings.qrCodeUrl || BUSINESS_INFO.qrCodeUrl,
            qrUpiId: data.settings.qrUpiId || BUSINESS_INFO.upiId,
            whatsappNumber: data.settings.whatsappNumber || BUSINESS_INFO.primaryWhatsApp,
            tradeName: data.settings.tradeName || BUSINESS_INFO.tradeName,
            gstin: data.settings.gstin || BUSINESS_INFO.gstin,
          });
        }
      } catch (err) {
        console.error("Error loading payment settings:", err);
      }
    }
    loadSettings();
  }, [defaultFee]);

  const taxes = calculateGstBreakdown(settings.registrationFee);
  const totalAmount = taxes.totalAmount;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(settings.qrUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello RishteClub team, I have completed the registration payment of ₹${totalAmount.toFixed(
      2
    )} for Profile Name: ${nameParam || "Registered Candidate"}${
      profileId ? ` (Profile ID: ${profileId})` : ""
    }. Please find my payment screenshot attached.`
  );

  const whatsappLink = `https://wa.me/91${settings.whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF5EB] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7A5835] mb-2.5 border border-[#E8DCC8]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Matrimonial Membership Payment</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#4A121A] font-serif-luxury tracking-tight">
            Rishte<span className="text-[#C5A059]">Club</span>
          </h1>

          <p className="mt-1 text-xs text-[#7A5835] font-semibold uppercase tracking-[0.16em]">
            Managed by NNVS Matrimony
          </p>
        </div>

        {/* Profile Details Tag */}
        {profileId && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#FAF6EF] px-5 py-3 border border-[#E8DCC8] text-xs">
            <span className="text-gray-600">Registered Profile ID:</span>
            <span className="font-mono font-bold text-[#4A121A] text-sm">{profileId}</span>
          </div>
        )}

        {/* Amount & GST Card */}
        <div className="rounded-2xl border border-[#E8DCC8] bg-[#FAF8F5] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC8]">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Applicable Registration Fee
            </h2>
            <span className="text-xs font-mono font-bold bg-[#4A121A] text-[#DFBA73] px-2.5 py-0.5 rounded-md">
              SAC: {BUSINESS_INFO.sacCode}
            </span>
          </div>

          <div className="space-y-2.5 pt-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Service Base Fee</span>
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

            <div className="border-t border-[#E8DCC8] pt-2 flex justify-between text-lg font-black text-[#4A121A]">
              <span>Total Payable (incl. GST)</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Authoritative Original QR Code Section */}
        <div className="mt-6 rounded-2xl border-2 border-dashed border-[#DFBA73] bg-[#FAF8F5] p-6 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A5835] mb-3">
            <QrCode className="h-4 w-4 text-[#C5A059]" />
            <span>Scan to Pay Using Any UPI App</span>
          </div>

          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-2xl bg-white p-2 shadow-md border border-gray-200 overflow-hidden">
            <img
              src="/payment-qr.jpeg"
              alt="RishteClub Official Payment QR"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>

          {/* UPI ID Box */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 border border-[#DACBB4] shadow-xs">
              <span className="text-xs text-gray-500 font-medium">UPI ID:</span>
              <span className="font-mono text-sm font-bold text-gray-900">{settings.qrUpiId}</span>
              <button
                type="button"
                onClick={handleCopyUPI}
                className="ml-1 rounded-lg p-1 text-gray-500 hover:text-gray-900 transition"
                title="Copy UPI ID"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Clear Hindi Instruction directly under QR */}
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-bold text-xs sm:text-sm">
            Payment karne ke baad screenshot aur apna Profile Name WhatsApp par {settings.whatsappNumber} par bheje.
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="mt-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Next Steps After Payment:
          </h3>

          <div className="space-y-2.5 rounded-2xl bg-white p-4 border border-gray-200 text-xs text-gray-700">
            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#4A121A] text-[10px] font-bold text-white">
                1
              </span>
              <p>
                Scan the QR code above or send <strong>₹{totalAmount.toFixed(2)}</strong> to UPI ID <strong>{settings.qrUpiId}</strong> using GPay, PhonePe, Paytm, or BHIM.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#4A121A] text-[10px] font-bold text-white">
                2
              </span>
              <p>
                Save the payment screenshot showing the UTR / Transaction Reference Number.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#4A121A] text-[10px] font-bold text-white">
                3
              </span>
              <p>
                Send the screenshot along with your <strong>Profile Name</strong> to our official WhatsApp number: <strong>+91 {settings.whatsappNumber}</strong>.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Note:</strong> WhatsApp Only – Do Not Call. Your profile will be reviewed and activated by our team upon manual payment confirmation.
            </span>
          </div>
        </div>

        {/* Send to WhatsApp CTA Button */}
        <div className="mt-6 space-y-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] py-4 text-white font-bold shadow-lg transition text-base"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Send Screenshot on WhatsApp (+91 {settings.whatsappNumber})</span>
          </a>

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
            Official GST Tax Invoice will be issued under trade name <strong>{settings.tradeName}</strong> (GSTIN: <span className="font-mono">{settings.gstin}</span>) upon admin payment confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-[#F4EFEA] px-4 py-12">
      <Suspense
        fallback={
          <div className="text-center py-20 text-gray-500 font-semibold">
            Loading payment instructions...
          </div>
        }
      >
        <PaymentContent />
      </Suspense>
    </main>
  );
}