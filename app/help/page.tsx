import { BUSINESS_INFO } from "@/lib/gst";
import { UserCheck, HelpCircle, ShieldCheck, Mail, Phone, Clock } from "lucide-react";

export default function HelpPage() {
  return (
    <main className="bg-[#FAF6EF] min-h-screen py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-10 md:p-12 shadow-md border border-[#DACBB4]">

          <div className="text-center">
            <span className="font-serif-luxury text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              SUPPORT & ASSISTANCE
            </span>
            <h1 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold text-[#4A121A] mt-2">
              Help Center
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#5A4E48]">
              Need help navigating RishteClub? Our team is here to assist you.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">

            <div className="rounded-2xl bg-white p-6 border border-[#E8DCC8]">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-5 w-5 text-[#C5A059]" />
                <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                  Registration Support
                </h2>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
                If you encounter any issues while completing registration, submitting your biodata, or receiving the OTP, please contact our support team.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-[#E8DCC8]">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-5 w-5 text-[#C5A059]" />
                <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                  Profile & Photo Assistance
                </h2>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
                For assistance with updating profile information, uploading photos, privacy preferences, or member verification, reach out to our team.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-[#E8DCC8]">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-[#C5A059]" />
                <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                  Payment & Invoicing
                </h2>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
                Registration fees (Female: ₹{BUSINESS_INFO.fees.female} + GST, Male: ₹{BUSINESS_INFO.fees.male} + GST) are handled under business entity {BUSINESS_INFO.tradeName} (GSTIN: {BUSINESS_INFO.gstin}).
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-[#E8DCC8]">
              <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A] mb-3">
                Direct Contact Helpline
              </h2>
              <div className="space-y-2 text-xs sm:text-sm text-[#5A4E48]">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#C5A059]" />
                  <a href={`mailto:${BUSINESS_INFO.email}`} className="font-semibold hover:text-[#4A121A]">
                    {BUSINESS_INFO.email}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#C5A059]" />
                  <span>{BUSINESS_INFO.helplineNumbers.join(" / ")}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#C5A059]" />
                  <span>{BUSINESS_INFO.callingHours}</span>
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}