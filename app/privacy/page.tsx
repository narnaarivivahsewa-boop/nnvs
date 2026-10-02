import { BUSINESS_INFO } from "@/lib/gst";

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[#FAF6EF] min-h-screen py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-10 md:p-12 shadow-md border border-[#DACBB4]">
          {/* Header */}
          <div className="border-b border-[#E8DCC8] pb-6">
            <span className="font-serif-luxury text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              PRIVACY & SECURITY
            </span>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-extrabold text-[#2D221E] mt-1">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs text-[#5A4E48]">
              Last Updated: October 2026
            </p>
          </div>

          <div className="mt-8 space-y-8 text-[#5A4E48] text-xs sm:text-sm leading-relaxed">
            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                1. Introduction
              </h2>
              <p className="mt-2">
                <strong>{BUSINESS_INFO.brandName}</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), an initiative associated with {BUSINESS_INFO.associatedBrand}, respects the privacy of its members and is committed to safeguarding personal information shared with us through our website and matrimonial matchmaking services.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                2. Information We Collect
              </h2>
              <p className="mt-2">
                We may collect information provided voluntarily by members during registration and profile creation, including full name, age, gender, contact phone number, email address, educational background, occupation, residence location, matrimonial preferences, and photographs.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                3. Use of Information
              </h2>
              <p className="mt-2">
                The information collected is used exclusively for creating and managing matrimonial profiles, facilitating match discovery between genuine families, verifying member authenticity, communicating account updates, and maintaining community standards.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                4. Profile Visibility & Access Control
              </h2>
              <p className="mt-2">
                Members acknowledge that information submitted for their matrimonial profile is shared with other registered members to enable matchmaking. Sensitive contact numbers are protected and only shared in accordance with member permissions and verified inquiries.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                5. Data Security
              </h2>
              <p className="mt-2">
                We implement industry-standard encryption, tokenized authentication, and secure database practices to protect member information against unauthorized access, misuse, or alteration.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                6. Third-Party Services
              </h2>
              <p className="mt-2">
                Technical infrastructure such as secure hosting, SMS/OTP gateways, and authorized payment gateways operate under strict confidentiality and standard data protection protocols.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                7. Contact & Privacy Inquiries
              </h2>
              <p className="mt-2">
                For privacy-related questions, corrections, or profile removal assistance, please write to:
              </p>
              <div className="mt-3 p-4 rounded-xl bg-white border border-[#DACBB4] space-y-1">
                <p><strong>Email:</strong> {BUSINESS_INFO.email}</p>
                <p><strong>Platform:</strong> {BUSINESS_INFO.brandName} (Associated with {BUSINESS_INFO.associatedBrand})</p>
                <p><strong>Proprietor:</strong> {BUSINESS_INFO.proprietor} (Trade Name: {BUSINESS_INFO.tradeName})</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}