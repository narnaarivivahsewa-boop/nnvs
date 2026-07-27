export default function WhyChoose() {
  const features = [
    {
      icon: "✅",
      title: "Verified Profiles",
      desc: "Every profile is manually verified before publishing.",
    },
    {
      icon: "🔒",
      title: "Privacy First",
      desc: "Your personal details stay secure and protected.",
    },
    {
      icon: "❤️",
      title: "Community Service",
      desc: "NNVS is a social initiative dedicated to helping families.",
    },
    {
      icon: "🤝",
      title: "Trusted Families",
      desc: "Connect only with genuine and trusted families.",
    },
  ];

  return (
    <section className="bg-gray-100 py-24">

      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-bold text-center text-red-900">
          Why Choose NNVS
        </h2>

        <p className="text-center text-gray-500 mt-4">
          A trusted matrimonial platform built for the community.
        </p>

        <div className="grid md:grid-cols-4 gap-8 mt-16">

          {features.map((item, index) => (

            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 text-center hover:-translate-y-2 duration-300"
            >

              <div className="text-6xl">
                {item.icon}
              </div>

              <h3 className="mt-6 text-2xl font-bold text-red-900">
                {item.title}
              </h3>

              <p className="mt-4 text-gray-600 leading-7">
                {item.desc}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}