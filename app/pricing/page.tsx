import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  CalendarClock,
  ArrowRight,
  FileText,
  Users,
  HeartHandshake,
} from "lucide-react";
import { BUSINESS_INFO } from "@/lib/gst";
import {
  getRegistrationPricingDetails,
  OFFER_VALIDITY_LABEL,
} from "@/lib/pricing";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Matrimony Registration Fees & Special Launch Offer",
  description:
    "Transparent one-time matrimonial registration fees on RishteClub (NNVS Matrimony) with 18% GST billing under Trendy Traders. View our Special Launch Offer and benefits.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Matrimony Registration Fees & Special Launch Offer | RishteClub",
    description:
      "Transparent one-time matrimonial registration fees on RishteClub with 100% verified profiles and 36 Guna Kundali Milan.",
    url: "https://www.rishteclub.com/pricing",
    siteName: "RishteClub Matrimony",
    locale: "en_IN",
    type: "website",
  },
};

export default function PricingPage() {
  const femalePricing = getRegistrationPricingDetails("FEMALE");
  const malePricing = getRegistrationPricingDetails("MALE");
  const isOfferActive = femalePricing.isOfferActive;

  const plans = [
    {
      key: "FEMALE" as const,
      title: "Bride Registration (Kanya)",
      subtitle: "Verified Lifetime Matrimonial Listing",
      badge: isOfferActive ? "LAUNCH OFFER • SAVE ₹354" : "STANDARD PLAN",
      pricing: femalePricing,
      accentBorder: "border-rose-300",
      badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
    },
    {
      key: "MALE" as const,
      title: "Groom Registration (Var)",
      subtitle: "Verified Lifetime Matrimonial Listing",
      badge: isOfferActive ? "LAUNCH OFFER • SAVE ₹826" : "STANDARD PLAN",
      pricing: malePricing,
      accentBorder: "border-[#C5A059]",
      badgeBg: "bg-[#FAF0DC] text-[#4A121A] border-[#DFBA73]",
    },
  ];

  const includedBenefits = [
    "100% Mobile & Family Background-Reviewed Biodata",
    "Direct Contact Access to Matching Families (Zero Commission)",
    "Complimentary 36 Guna Ashtakoota Kundali Milan Tool",
    "Auto-Generated Official GST Tax Invoice & PDF Biodata",
    "No Monthly Subscriptions or Hidden Renewal Charges",
  ];

  return (
    <main className="min-h-screen bg-[#FAF6EF] text-[#2D221E]">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#4A121A] via-[#3A0C13] to-[#24060B] py-14 sm:py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-serif-luxury text-xs font-semibold uppercase tracking-[0.25em] text-[#DFBA73] mb-3">
            🙏 JAI SHREE SHYAM 🙏
          </p>

          {isOfferActive ? (
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#DFBA73] bg-[#DFBA73]/15 px-4 py-1.5 text-xs sm:text-sm font-bold text-[#DFBA73] mb-5">
              <Sparkles className="h-4 w-4" />
              <span>SPECIAL LAUNCH OFFER — ONLY ₹99 + GST</span>
              <span className="text-white/60">|</span>
              <span className="inline-flex items-center gap-1 text-white">
                <CalendarClock className="h-3.5 w-3.5 text-[#DFBA73]" />
                {OFFER_VALIDITY_LABEL}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DFBA73]/40 bg-[#DFBA73]/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#DFBA73] mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Transparent One-Time Matrimony Membership</span>
            </div>
          )}

          <h1 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            {isOfferActive
              ? "Special Launch Offer — Only ₹99 + GST"
              : "Simple & Transparent Registration Fees"}
          </h1>

          <p className="mt-4 mx-auto max-w-2xl text-sm sm:text-lg text-[#E8D8C0] leading-relaxed">
            {isOfferActive
              ? "Find Your Perfect Life Partner with 100% Verified Profiles & 36 Guna Kundali Milan. Same flat launch price for both Brides & Grooms — Valid till 31st Dec 2026."
              : "One-time membership registration with full access to verified families, direct communication, and zero middlemen brokerage."}
          </p>
        </div>
      </section>

      {/* Main Plans Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-3xl bg-white p-6 sm:p-8 shadow-xl border-2 ${plan.accentBorder} flex flex-col justify-between`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${plan.badgeBg}`}
                  >
                    {plan.badge}
                  </span>
                  {isOfferActive && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
                      {OFFER_VALIDITY_LABEL}
                    </span>
                  )}
                </div>

                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#4A121A]">
                  {plan.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#6B5A53] mt-1">
                  {plan.subtitle}
                </p>

                {/* Fee Showcase */}
                <div className="mt-6 rounded-2xl bg-[#FAF6EF] border border-[#E8DCC8] p-5">
                  {isOfferActive && (
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Regular Fee:</span>
                      <span className="line-through font-semibold">
                        ₹{plan.pricing.regularBaseFee} + GST (₹
                        {plan.pricing.regularTotalAmount.toFixed(2)})
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-4xl sm:text-5xl font-black text-[#4A121A]">
                      ₹{plan.pricing.baseFee}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-[#7A5835]">
                      + {plan.pricing.gstRate}% GST
                    </span>
                    <span className="ml-auto rounded-xl bg-[#4A121A] px-3 py-1 text-xs sm:text-sm font-extrabold text-[#DFBA73]">
                      Total ₹{plan.pricing.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* GST Breakdown */}
                  <div className="mt-4 pt-3 border-t border-[#E8DCC8] grid grid-cols-3 gap-2 text-[11px] text-[#5A4E48]">
                    <div>
                      <span className="block text-gray-500">Taxable Base</span>
                      <strong className="text-[#2D221E]">
                        ₹{plan.pricing.baseFee.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-gray-500">CGST (9%)</span>
                      <strong className="text-[#2D221E]">
                        ₹{plan.pricing.cgstAmount.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-gray-500">SGST (9%)</span>
                      <strong className="text-[#2D221E]">
                        ₹{plan.pricing.sgstAmount.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Benefits Checklist */}
                <ul className="mt-6 space-y-3">
                  {includedBenefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[#4A3E39]"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A121A] to-[#6B1D29] hover:from-[#3A0C13] hover:to-[#4A121A] py-3.5 px-5 text-sm sm:text-base font-bold text-white shadow-lg transition"
                >
                  <span>
                    Register Now at ₹{plan.pricing.baseFee} + GST
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#DFBA73]" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Kundali Milan & Astrology Remedies Strip */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-[#DACBB4] shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C5A059] mb-2">
              <HeartHandshake className="h-4 w-4" />
              <span>Vedic Astrology &amp; Kundali Services</span>
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-[#4A121A]">
              36 Guna Kundali Milan &amp; Lal Kitab Remedies
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#5A4E48] leading-relaxed">
              Instant Ashtakoota Guna Milan compatibility scoring is free to check,
              while detailed AI Vedic Astrological Remedies &amp; Lal Kitab Consultation is available at a flat{" "}
              <strong className="text-[#4A121A]">
                ₹99 + 18% GST (₹116.82 total)
              </strong>
              .
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/kundli-milan"
                className="rounded-xl bg-[#FAF0DC] border border-[#C5A059] px-4 py-2 text-xs font-bold text-[#4A121A] hover:bg-[#F2E4C8] transition"
              >
                Open Kundali Milan →
              </Link>
              <Link
                href="/astrology"
                className="rounded-xl border border-[#DACBB4] px-4 py-2 text-xs font-bold text-[#5A4E48] hover:border-[#4A121A] hover:text-[#4A121A] transition"
              >
                Astrology Remedies →
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-8 border border-[#DACBB4] shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7A5835] mb-2">
              <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
              <span>GST Compliance &amp; Official Invoicing</span>
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-[#4A121A]">
              Verified Indian Business Billing
            </h3>
            <div className="mt-3 space-y-1.5 text-xs sm:text-sm text-[#5A4E48]">
              <p>
                <strong>Registered Trade Name:</strong> {BUSINESS_INFO.tradeName}{" "}
                (Unit: NNVS Matrimony)
              </p>
              <p>
                <strong>GSTIN:</strong>{" "}
                <span className="font-mono font-bold text-[#4A121A]">
                  {BUSINESS_INFO.gstin}
                </span>{" "}
                | <strong>SAC Code:</strong>{" "}
                <span className="font-mono font-bold text-[#4A121A]">
                  {BUSINESS_INFO.sacCode}
                </span>
              </p>
              <p>
                <strong>MSME Udyam:</strong>{" "}
                <span className="font-mono">{BUSINESS_INFO.udyamRegistrationNumber}</span>
              </p>
              <p className="pt-1 text-xs text-[#6B5A53] flex items-start gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#C5A059] mt-0.5 flex-shrink-0" />
                <span>
                  Every payment generates a downloadable GST Tax Invoice (with CGST 9% + SGST 9% / IGST 18% breakdown) inside your member dashboard.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Support Callout */}
        <div className="mt-8 rounded-2xl bg-[#4A121A] p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-[#DFBA73] flex-shrink-0" />
            <div>
              <p className="font-bold text-sm sm:text-base">
                Need help registering your family profile?
              </p>
              <p className="text-xs text-[#E2D2BC]">
                Message our support desk on WhatsApp at +91{" "}
                {BUSINESS_INFO.primaryWhatsApp} (WhatsApp Only – Do Not Call)
              </p>
            </div>
          </div>
          <Link
            href="/register"
            className="rounded-xl bg-[#DFBA73] px-6 py-2.5 text-xs sm:text-sm font-black text-[#3A0C13] hover:bg-[#e7cb92] transition whitespace-nowrap"
          >
            Create Biodata Now
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

