import Link from "next/link";

export default function Hero() {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">

        <h1 className="text-6xl font-bold text-red-900">
          NNVS MATRIMONY
        </h1>

        <p className="mt-5 text-xl text-gray-600">
          समाज के प्रति एक सेवा
        </p>

        <p className="mx-auto mt-6 max-w-2xl leading-8 text-gray-500">
          Trusted Matrimony Platform for Nar Naari Vivah Sewa.
          Search verified profiles, connect with families and
          find your perfect life partner.
        </p>

        <div className="mt-10 flex justify-center gap-5">

          <Link
            href="/register"
            className="rounded-xl bg-red-900 px-8 py-4 text-white shadow-lg transition hover:bg-red-800"
          >
            Register Now
          </Link>

          <Link
            href="/profiles"
            className="rounded-xl border-2 border-red-900 px-8 py-4 text-red-900 transition hover:bg-red-50"
          >
            Browse Profiles
          </Link>

        </div>

        <p className="mt-5 text-sm font-medium text-gray-600">
          Female Registration:{" "}
          <span className="font-bold text-red-800">
            ₹399 + GST
          </span>
          {" "} | {" "}
          Male Registration:{" "}
          <span className="font-bold text-red-800">
            ₹799 + GST
          </span>
        </p>

      </div>
    </section>
  );
}