import Link from "next/link";
import { BUSINESS_INFO } from "@/lib/gst";
import { Mail, Phone, Clock, ArrowLeft, MessageSquare } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#FAF6EF] py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        <div className="text-center">
          <span className="font-serif-luxury text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
            WE ARE HERE TO HELP
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold text-[#4A121A] mt-2">
            Contact RishteClub
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#5A4E48]">
            हमसे संपर्क करें — हम आपकी सहायता के लिए सदैव तत्पर हैं।
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">

          {/* Contact Information */}
          <div className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-8 shadow-sm border border-[#DACBB4]">
            <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#4A121A] flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#C5A059]" />
              <span>Get in Touch</span>
            </h2>

            <div className="mt-6 space-y-5">
              <div className="p-4 bg-white rounded-2xl border border-[#E8DCC8]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8C6239] flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#C5A059]" />
                  <span>Email Support</span>
                </p>
                <a
                  href={`mailto:${BUSINESS_INFO.email}`}
                  className="mt-1 block text-sm font-semibold text-[#2D221E] hover:text-[#4A121A] transition"
                >
                  {BUSINESS_INFO.email}
                </a>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#E8DCC8]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8C6239] flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#C5A059]" />
                  <span>Helpline Numbers</span>
                </p>
                <div className="mt-1 space-y-1">
                  <a
                    href={`tel:${BUSINESS_INFO.helplineNumbers[0]}`}
                    className="block text-sm font-semibold text-[#2D221E] hover:text-[#4A121A] transition"
                  >
                    {BUSINESS_INFO.helplineNumbers[0]}
                  </a>
                  <a
                    href={`tel:${BUSINESS_INFO.helplineNumbers[1]}`}
                    className="block text-sm font-semibold text-[#2D221E] hover:text-[#4A121A] transition"
                  >
                    {BUSINESS_INFO.helplineNumbers[1]}
                  </a>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#E8DCC8]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8C6239] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#C5A059]" />
                  <span>Calling Hours</span>
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2D221E]">
                  {BUSINESS_INFO.callingHours}
                </p>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-8 shadow-sm border border-[#DACBB4] flex flex-col justify-between">
            <div>
              <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#4A121A] flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#C5A059]" />
                <span>How Can We Help?</span>
              </h2>

              <p className="mt-5 text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
                If you need assistance with registration, profile creation, profile verification, payment or matchmaking services on <strong>RishteClub</strong>, please reach out during our calling hours.
              </p>

              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
                You can also email us anytime with your member ID or query, and our team will get back to you promptly.
              </p>

              <div className="mt-5 p-3.5 bg-[#FAF0DC] rounded-xl border border-[#DFBA73] text-[11px] text-[#6B4F3B]">
                <strong>Legacy Notice:</strong> If you registered previously through NNVS Matrimony, all your account records, profile IDs, and verification statuses remain valid and active.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8DCC8]">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#4A121A] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A0C13]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}