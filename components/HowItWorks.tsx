export default function HowItWorks() {
  return (
    <section className="py-20">
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

          {/* Find Your Match */}
          <div className="bg-gray-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4">
              🔍
            </div>

            <h3 className="text-2xl font-bold text-red-900">
              Find Your Match
            </h3>

            <p className="mt-4 text-gray-600">
              Browse verified profiles and find suitable matches.
            </p>
          </div>

          {/* Create Profile */}
          <div className="bg-gray-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4">
              📝
            </div>

            <h3 className="text-2xl font-bold text-red-900">
              Create Profile
            </h3>

            <p className="mt-4 text-gray-600">
              Register and create your matrimonial profile.
            </p>
          </div>

          {/* Connect */}
          <div className="bg-gray-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4">
              💌
            </div>

            <h3 className="text-2xl font-bold text-red-900">
              Connect
            </h3>

            <p className="mt-4 text-gray-600">
              Explore suitable profiles and connect with families.
            </p>

            <div className="mt-5 space-y-2 text-gray-700 text-sm">
              <p>
                <strong>Email:</strong>{" "}
                narnaarivivahsewa@gmail.com
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                +91 9871592002
              </p>
            </div>
          </div>

          {/* Begin Your Journey */}
          <div className="bg-gray-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4">
              🤝
            </div>

            <h3 className="text-2xl font-bold text-red-900">
              Begin Your Journey
            </h3>

            <p className="mt-4 text-gray-600">
              Take the next step towards finding your life partner.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}