export default function HowItWorks() {
  return (
    <section className="py-24 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-red-900">
            How It Works
          </h2>

          <p className="mt-4 text-gray-500 text-xl">
            Simple steps to find your perfect life partner.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">

          <div className="bg-gray-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-red-900">
              Register
            </h3>
            <p className="mt-4 text-gray-600">
              Fill the registration form and submit your details.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-red-900">
              Verification
            </h3>
            <p className="mt-4 text-gray-600">
              Our team verifies every profile before publishing.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-2xl font-bold text-red-900">
              Profile Published
            </h3>
            <p className="mt-4 text-gray-600">
              Your profile becomes visible to verified members.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4">💍</div>
            <h3 className="text-2xl font-bold text-red-900">
              Find Your Match
            </h3>
            <p className="mt-4 text-gray-600">
              Connect with families and begin your journey.
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}