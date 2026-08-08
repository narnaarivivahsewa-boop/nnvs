const faqs = [
  {
    question: "What is NNVS Matrimony?",
    answer:
      "NNVS Matrimony is a matrimonial platform created to help families and individuals find suitable matrimonial matches.",
  },
  {
    question: "How can I register?",
    answer:
      "You can register through the Register option available on the website and complete the required profile information.",
  },
  {
    question: "Is registration free?",
    answer:
      "Registration on the website is subject to the applicable registration fee. The current fee structure will be displayed during the registration process.",
  },
  {
    question: "Are profiles verified?",
    answer:
      "Profiles may be reviewed and verified by NNVS before being made available on the platform.",
  },
  {
    question: "Can I update my profile?",
    answer:
      "Yes. Registered members can update their profile information through the available profile management options.",
  },
  {
    question: "How can I contact NNVS?",
    answer:
      "You can contact NNVS at narnaarivivahsewa@gmail.com or call +91 9871592002 / +91 7015812359 between 5:30 PM and 7:30 PM.",
  },
  {
    question: "Can I delete my profile?",
    answer:
      "Members may contact NNVS for assistance regarding profile removal or account-related requests.",
  },
];

export default function FAQsPage() {
  return (
    <main className="bg-gray-50 min-h-screen py-16">
      <div className="mx-auto max-w-5xl px-6">

        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-900">
            Frequently Asked Questions
          </h1>

          <p className="mt-4 text-gray-600">
            Frequently asked questions about NNVS Matrimony.
          </p>
        </div>

        <div className="mt-10 space-y-5">

          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white p-6 shadow"
            >
              <h2 className="text-xl font-bold text-red-900">
                {faq.question}
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                {faq.answer}
              </p>
            </div>
          ))}

        </div>

      </div>
    </main>
  );
}