export default function HelpPage() {
  return (
    <main className="bg-gray-50 min-h-screen py-16">
      <div className="mx-auto max-w-5xl px-6">

        <div className="rounded-3xl bg-white p-8 shadow-lg md:p-12">

          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-900">
              Help Center
            </h1>

            <p className="mt-4 text-gray-600">
              Need help with NNVS Matrimony? We are here to assist you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">

            <div className="rounded-2xl bg-gray-50 p-6">
              <h2 className="text-xl font-bold text-red-900">
                Registration Help
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                If you are facing any difficulty while registering or
                creating your matrimonial profile, please contact our
                support team.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-6">
              <h2 className="text-xl font-bold text-red-900">
                Profile Help
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                For assistance with profile information, photographs,
                profile updates or other profile-related issues, contact
                NNVS support.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-6">
              <h2 className="text-xl font-bold text-red-900">
                Payment Help
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                If you experience an issue with registration payment,
                please keep your payment details or transaction reference
                available when contacting us.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-6">
              <h2 className="text-xl font-bold text-red-900">
                Contact Support
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                Email:
                <br />
                <strong>
                  narnaarivivahsewa@gmail.com
                </strong>
              </p>

              <p className="mt-3 leading-7 text-gray-600">
                Phone:
                <br />
                +91 9871592002
                <br />
                +91 7015812359
              </p>

              <p className="mt-3 text-gray-600">
                Calling Time: 5:30 PM – 7:30 PM
              </p>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}