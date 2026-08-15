import Link from "next/link";

const steps = [
  {
    icon: "🔎",
    title: "Find Your Match",
    description: "Browse suitable profiles and discover your perfect match.",
    href: "/profiles",
    button: "Browse Profiles",
  },
  {
    icon: "📝",
    title: "Create Profile",
    description: "Register and create your matrimonial profile with your details.",
    href: "/register",
    button: "Register Now",
  },
  {
    icon: "💌",
    title: "Connect",
    description: "Explore suitable profiles and connect with families.",
    href: "/contact",
    button: "Contact Us",
  },
  {
    icon: "🤝",
    title: "Begin Your Journey",
    description: "Take the next step towards finding your life partner.",
    href: "/register",
    button: "Start Your Journey",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gradient-to-b from-white to-rose-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-red-800">
            Simple & Trusted
          </p>

          <h2 className="text-4xl font-extrabold text-red-900 sm:text-5xl">
            How It Works
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            A simple journey from creating your profile to finding
            a suitable life partner.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">

          {steps.map((step, index) => (
            <Link
              key={step.title}
              href={step.href}
              className="group relative rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-md transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >

              {/* Step Number */}
              <div className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-red-900 text-sm font-bold text-white">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-5xl shadow-inner transition duration-300 group-hover:scale-110 group-hover:bg-red-100">
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="mt-7 text-2xl font-bold text-red-900">
                {step.title}
              </h3>

              {/* Description */}
              <p className="mt-4 min-h-[72px] text-base leading-7 text-gray-600">
                {step.description}
              </p>

              {/* Button */}
              <span className="mt-7 inline-flex rounded-full bg-red-900 px-6 py-3 text-sm font-bold text-white transition group-hover:bg-red-700">
                {step.button}
                <span className="ml-2 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>

            </Link>
          ))}

        </div>

        {/* Bottom CTA */}
        <div className="mt-14 rounded-3xl bg-red-900 px-6 py-10 text-center shadow-xl">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Find Your Life Partner?
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-red-100">
            Create your NNVS Matrimony profile and take the first
            step towards a meaningful relationship.
          </p>

          <Link
            href="/register"
            className="mt-6 inline-flex rounded-xl bg-white px-8 py-4 font-bold text-red-900 shadow-lg transition hover:scale-105"
          >
            Register Now →
          </Link>
        </div>

      </div>
    </section>
  );
}