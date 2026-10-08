import { BUSINESS_INFO } from "@/lib/gst";

export default function TermsPage() {
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
              Terms & Conditions
            </h1>
            <p className="mt-2 text-xs text-[#5A4E48]">
              Last Updated: October 2026
            </p>
          </div>

          {/* Important Highlight Notice */}
          <div className="my-8 rounded-2xl bg-[#FAF0DC] p-5 sm:p-6 border-2 border-[#DFBA73] text-[#2D221E] space-y-2">
            <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-[#4A121A] flex items-center gap-2">
              <span>⚠️</span>
              <span>महत्वपूर्ण कानूनी सूचना (Important Legal Notice & Disclaimer)</span>
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#4A121A] leading-relaxed">
              RishteClub किसी भी उम्मीदवार की शादी करवाने का कोई वादा (Promise) या गैरंटी (Guarantee) नहीं देता है।
            </p>
            <p className="text-xs sm:text-sm text-[#5A4E48] leading-relaxed">
              यह केवल उपयुक्त, इच्छुक एवं वेरिफाइड मैट्रिमोनियल प्रोफाइल्स को एक मंच पर लाने, सर्च करने और परिवारों को आपस में संपर्क करने का एक सुविधा-माध्यम (Introductory Matchmaking Platform) है। रिश्ते को आगे बढ़ाने या अंतिम निर्णय लेने से पूर्व, सामने वाले व्यक्ति व परिवार की पृष्ठभूमि की स्वतंत्र जाँच-पड़ताल (Independent Verification & Background Scrutiny) करना पूरी तरह उम्मीदवार व उनके परिवार की जिम्मेदारी है।
            </p>
          </div>

          <div className="mt-8 space-y-8 text-[#5A4E48] text-xs sm:text-sm leading-relaxed">
            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                1. Acceptance of Terms
              </h2>
              <p className="mt-2">
                By accessing or using RishteClub (an initiative associated with NNVS Matrimony – Nar Naari Vivah Sewa), you agree to comply with and be bound by these Terms & Conditions. If you do not agree with these terms, please do not access or use the platform.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                2. Nature of Platform & No Guarantee of Marriage (प्लेटफॉर्म का स्वरूप व गैरंटी का अभाव)
              </h2>
              <p className="mt-2">
                <strong>(a) Introductory Platform Only:</strong> RishteClub is an introductory matchmaking facilitation portal designed solely to help eligible candidates and their families search, discover, and initiate communication with matching profiles.
              </p>
              <p className="mt-2">
                <strong>(b) No Guarantee or Promise of Marriage:</strong> RishteClub and its operators do NOT guarantee, warrant, or promise that any member will find a life partner, receive proposals, or successfully solemnize a marriage through this platform. Matchmaking depends entirely on mutual compatibility, individual preferences, and family consensus.
              </p>
              <p className="mt-2">
                <strong>(c) Member Due Diligence:</strong> It is the sole responsibility of the member and their guardians/family to conduct comprehensive, independent background checks, character verification, employment and educational credential checks, and health/family scrutiny before solemnizing any alliance or engaging in financial transactions. The platform shall not be held liable for any dispute, misrepresentation, or dissatisfaction arising between parties.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                3. Eligibility
              </h2>
              <p className="mt-2">
                The services are strictly intended for individuals who are legally eligible to marry under the applicable marriage laws of India (Females: minimum 18 years, Males: minimum 21 years, or legally applicable age). Members are responsible for ensuring that all details provided are truthful and accurate.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                4. Registration & Registration Fee
              </h2>
              <p className="mt-2">
                Registration with RishteClub is a paid service subject to the completion of profile verification and payment of the applicable one-time non-refundable registration fee (Female: ₹{BUSINESS_INFO.fees.female} + GST, Male: ₹{BUSINESS_INFO.fees.male} + GST, or as updated from time to time).
              </p>
              <p className="mt-2">
                Payment of registration fees covers profile listing, review, and platform access services. It does not constitute a guarantee of marriage or alliance fulfillment.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                5. Member Conduct & Prohibited Activities
              </h2>
              <p className="mt-2">
                Members must not post fraudulent, misleading, obscene, or defamatory content. Impersonation, unauthorized solicitation, financial fraud, demand for dowry, harassment, or commercial abuse of member contacts will result in immediate termination of the account and appropriate legal reporting.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                6. Profile Verification & Admin Discretion
              </h2>
              <p className="mt-2">
                RishteClub reserves the right to review, verify, approve, edit, suspend, or reject any matrimonial profile or photograph submitted by members to maintain high community safety standards.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                7. Limitation of Liability
              </h2>
              <p className="mt-2">
                To the fullest extent permitted by law, RishteClub, Rahul Dhamija (Proprietor), associated entities, operators, and staff shall not be liable for any direct, indirect, incidental, or consequential damages resulting from interactions, matrimonial alliances, communication, or agreements between members.
              </p>
            </section>

            <section>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D221E]">
                8. Legal, Business & Grievance Information
              </h2>
              <p className="mt-2">
                For questions, clarifications, or reporting grievances regarding these terms:
              </p>
              <div className="mt-3 p-5 rounded-2xl bg-white border border-[#DACBB4] space-y-2 text-xs sm:text-sm">
                <p><strong>Platform:</strong> {BUSINESS_INFO.brandName} (Unit: {BUSINESS_INFO.additionalTradeNames[0]})</p>
                <p><strong>Operational Management:</strong> {BUSINESS_INFO.managedByFull}</p>
                <p><strong>Legal Entity / Trade Name:</strong> {BUSINESS_INFO.tradeName}</p>
                <p><strong>Proprietor:</strong> {BUSINESS_INFO.proprietor}</p>
                <p><strong>GSTIN:</strong> {BUSINESS_INFO.gstin} (Haryana)</p>
                <p><strong>MSME Udyam Registration:</strong> {BUSINESS_INFO.udyamRegistrationNumber}</p>
                <p><strong>Principal Place of Business:</strong> {BUSINESS_INFO.address.fullFormatted}</p>
                <p><strong>Official Email:</strong> {BUSINESS_INFO.email} | {BUSINESS_INFO.officialEmail}</p>
                <p><strong>WhatsApp Support:</strong> +91 {BUSINESS_INFO.primaryWhatsApp} (WhatsApp Only – Do Not Call)</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}