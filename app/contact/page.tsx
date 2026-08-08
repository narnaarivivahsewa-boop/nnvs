import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="mx-auto max-w-5xl px-6">

        <div className="text-center">
          <h1 className="text-5xl font-bold text-red-900">
            Contact NNVS Matrimony
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            हमसे संपर्क करें — हम आपकी सहायता के लिए उपलब्ध हैं।
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">

          {/* Contact Information */}
          <div className="rounded-3xl bg-white p-8 shadow-lg">

            <h2 className="text-2xl font-bold text-red-900">
              Get in Touch
            </h2>

            <div className="mt-8 space-y-6">

              <div>
                <p className="font-semibold text-gray-800">
                  📧 Email
                </p>

                <p className="mt-1 text-gray-600">
                  narnaarivivahsewa@gmail.com
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">
                  📞 Contact Numbers
                </p>

                <p className="mt-1 text-gray-600">
                  +91 9871592002
                </p>

                <p className="mt-1 text-gray-600">
                  +91 7015812359
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">
                  🕐 Calling Time
                </p>

                <p className="mt-1 text-gray-600">
                  5:30 PM – 7:30 PM
                </p>
              </div>

            </div>
          </div>

          {/* Support */}
          <div className="rounded-3xl bg-white p-8 shadow-lg">

            <h2 className="text-2xl font-bold text-red-900">
              How Can We Help?
            </h2>

            <p className="mt-5 leading-7 text-gray-600">
              If you need assistance with registration, profile creation,
              profile verification, payment or any other NNVS Matrimony
              service, please contact us during the calling hours.
            </p>

            <p className="mt-5 leading-7 text-gray-600">
              You can also email us with your query and our team will
              assist you.
            </p>

            <div className="mt-8">
              <Link
                href="/"
                className="inline-block rounded-xl bg-red-900 px-7 py-3 font-semibold text-white transition hover:bg-red-800"
              >
                Back to Home
              </Link>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}