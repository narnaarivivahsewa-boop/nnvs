import { BUSINESS_INFO } from "@/lib/gst";

const faqs = [
  {
    question: "What is RishteClub?",
    answer:
      "RishteClub is a matrimonial platform created to help families and individuals find suitable life partners. It is an initiative associated with NNVS Matrimony – Nar Naari Vivah Sewa.",
  },
  {
    question: "How can I register?",
    answer:
      "You can register easily through the 'Register Now' button on the website and complete your matrimonial biodata with educational, professional, and family details.",
  },
  {
    question: "What is the registration fee?",
    answer:
      `Registration on RishteClub is a one-time fee of ₹${BUSINESS_INFO.fees.female} + GST for Female profiles and ₹${BUSINESS_INFO.fees.male} + GST for Male profiles. This covers profile review, listing, and direct matrimonial access.`,
  },
  {
    question: "How are profiles verified?",
    answer:
      "Profiles are reviewed and verified by our team before being displayed on the platform to maintain a safe and respectful community.",
  },
  {
    question: "Can I update my profile details?",
    answer:
      "Yes. Registered members can log in using their registered mobile number and update their photos and personal details anytime from their Dashboard.",
  },
  {
    question: "How can I contact support?",
    answer:
      `You can contact our support team at ${BUSINESS_INFO.email} or call ${BUSINESS_INFO.helplineNumbers.join(" / ")} between ${BUSINESS_INFO.callingHours}.`,
  },
  {
    question: "What happened to my existing NNVS Matrimony profile?",
    answer:
      "All existing NNVS Matrimony profiles, profile IDs, and member data remain fully active and safely preserved on RishteClub. You can continue logging in seamlessly with your registered mobile number.",
  },
];

export default function FAQsPage() {
  return (
    <main className="bg-[#FAF6EF] min-h-screen py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        <div className="text-center">
          <span className="font-serif-luxury text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold text-[#4A121A] mt-2">
            Questions & Answers
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#5A4E48]">
            Everything you need to know about matchmaking on RishteClub.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl bg-[#FAF5EB] p-6 shadow-xs border border-[#DACBB4]"
            >
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#4A121A]">
                {faq.question}
              </h2>

              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}