import { BUSINESS_INFO } from "@/lib/gst";


export const metadata = {
  title: "Refund & Cancellation Policy - RishteClub (Managed by NNVS Matrimony)",
  description: "Official Refund & Cancellation Policy for RishteClub, operated by Trendy Traders (GSTIN: 06APYPD6931J1ZE) and managed by NNVS Matrimony.",
};

export default function RefundPage() {
  return (
    <main className="bg-[#FAF6EF] min-h-screen py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-10 md:p-12 shadow-md border border-[#DACBB4]">
          {/* Header */}
          <div className="border-b border-[#E8DCC8] pb-6">
            <span className="font-serif-luxury text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              LEGAL & POLICIES
            </span>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-extrabold text-[#2D221E] mt-1">
              Refund & Cancellation Policy
            </h1>
            <p className="mt-2 text-xs text-[#5A4E48]">
              Last Updated: October 2026
            </p>
          </div>

          <div className="mt-8 space-y-8 text-[#5A4E48] text-xs sm:text-sm leading-relaxed">
            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                1. Overview & Service Scope
              </h2>
              <p className="mt-2">
                <strong>RishteClub</strong> (https://rishteclub.com) is an online matchmaking facilitation platform owned and operated by <strong>{BUSINESS_INFO.tradeName}</strong> (Proprietor: {BUSINESS_INFO.proprietor}, GSTIN: {BUSINESS_INFO.gstin}) and managed by <strong>{BUSINESS_INFO.managedByFull}</strong>.
              </p>
              <p className="mt-2">
                The one-time registration fee charged to members covers profile digitization, verification, database storage, matching algorithm services, and administrative maintenance.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                2. Non-Refundable Nature of Registration Fees
              </h2>
              <p className="mt-2">
                All registration and membership fees paid to <strong>{BUSINESS_INFO.tradeName}</strong> are non-refundable once the profile verification or activation process is initiated.
              </p>
              <p className="mt-2">
                Since matchmaking depends on mutual compatibility between individuals and families, registration fees cannot be refunded on grounds such as:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Change of mind after registration or payment.</li>
                <li>Not finding a suitable alliance within a specific timeframe.</li>
                <li>Settling marriage outside the platform through personal or family contacts.</li>
                <li>Rejection or lack of interest response from other prospective profiles.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                3. Duplicate Payments & Technical Errors
              </h2>
              <p className="mt-2">
                If an applicant experiences a duplicate debit or technical error where payment was deducted more than once for the same profile registration:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Please notify our support team within <strong>7 days</strong> with transaction reference IDs.</li>
                <li>Upon verification, duplicate charges will be refunded to the original payment source within 5–7 business days.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                4. Account Deletion & Voluntary Cancellation
              </h2>
              <p className="mt-2">
                Members may choose to hide or delete their matrimonial profile at any time by contacting our helpline or logging into their account dashboard. However, voluntary profile cancellation or deletion does not entitle the member to a refund of previously paid fees.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                5. Official Legal & Grievance Contact
              </h2>
              <div className="mt-3 p-5 rounded-2xl bg-white border border-[#DACBB4] space-y-2 text-xs sm:text-sm">
                <p><strong>Platform:</strong> {BUSINESS_INFO.brandName} (https://rishteclub.com)</p>
                <p><strong>Operational Service:</strong> {BUSINESS_INFO.managedByFull}</p>
                <p><strong>Legal Entity / Trade Name:</strong> {BUSINESS_INFO.tradeName}</p>
                <p><strong>Proprietor:</strong> {BUSINESS_INFO.proprietor}</p>
                <p><strong>GSTIN:</strong> {BUSINESS_INFO.gstin}</p>
                <p><strong>Email:</strong> {BUSINESS_INFO.email}</p>
                <p><strong>WhatsApp Support:</strong> +91 {BUSINESS_INFO.primaryWhatsApp} (WhatsApp Only – Do Not Call)</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
