export default function Hero() {
  return (
    <section className="bg-gray-100">

      <div className="max-w-7xl mx-auto px-6 py-24 text-center">

        <h1 className="text-6xl font-bold text-red-900">
          NNVS MATRIMONY
        </h1>

        <p className="mt-5 text-xl text-gray-600">
          समाज के प्रति एक सेवा
        </p>

        <p className="mt-6 max-w-2xl mx-auto text-gray-500 leading-8">
          Trusted Matrimony Platform for Nar Naari Vivah Sewa.
          Search verified profiles, connect with families and
          find your perfect life partner.
        </p>

        <div className="mt-10 flex justify-center gap-5">

          <button className="bg-red-900 hover:bg-red-800 text-white px-8 py-4 rounded-xl shadow-lg">
            Register Free
          </button>

          <button className="border-2 border-red-900 text-red-900 hover:bg-red-50 px-8 py-4 rounded-xl">
            Browse Profiles
          </button>

        </div>

      </div>

    </section>
  );
}