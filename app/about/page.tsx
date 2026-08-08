import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <section className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">

          <h1 className="text-5xl font-bold text-red-900">
            About NNVS Matrimony
          </h1>

          <p className="mt-4 text-xl text-gray-600">
            समाज के प्रति एक सेवा
          </p>

          <p className="mx-auto mt-6 max-w-3xl text-gray-600 leading-8">
            NNVS Matrimony is a trusted platform created to help families
            search for suitable matrimonial matches and connect with
            verified members in a simple and respectful manner.
          </p>

        </div>
      </section>

      {/* Jai Shree Shyam */}
      <section className="bg-white border-b">
        <div className="py-8 text-center">
          <p className="text-3xl font-bold text-red-900">
            🙏 जय श्री श्याम 🙏
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="mx-auto max-w-5xl px-6 py-16">

        <div className="rounded-3xl bg-white p-8 shadow-lg md:p-12">

          <h2 className="text-3xl font-bold text-red-900">
            हमारे बारे में
          </h2>

          <p className="mt-6 leading-8 text-gray-600">
            NNVS Matrimony का उद्देश्य विवाह योग्य युवक-युवतियों एवं
            उनके परिवारों को एक भरोसेमंद माध्यम उपलब्ध कराना है, जहाँ
            वे अपनी आवश्यकताओं के अनुसार उपयुक्त जीवनसाथी की तलाश कर
            सकें।
          </p>

          <p className="mt-5 leading-8 text-gray-600">
            हमारा प्रयास है कि matrimonial profiles को व्यवस्थित तरीके
            से प्रस्तुत किया जाए और परिवारों को एक-दूसरे से संपर्क करने
            का सुविधाजनक माध्यम मिले।
          </p>

          <p className="mt-5 leading-8 text-gray-600">
            NNVS Matrimony समाज के प्रति सेवा की भावना के साथ बनाया गया
            एक matrimonial platform है, जिसका उद्देश्य परिवारों को
            बेहतर matrimonial connections उपलब्ध कराना है।
          </p>

        </div>

        {/* Mission */}
        <div className="mt-10 grid gap-8 md:grid-cols-2">

          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-red-900">
              हमारा उद्देश्य
            </h3>

            <p className="mt-4 leading-7 text-gray-600">
              योग्य matrimonial profiles को एक स्थान पर उपलब्ध कराना
              और परिवारों को उपयुक्त रिश्ते तलाशने में सहायता करना।
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-red-900">
              हमारा प्रयास
            </h3>

            <p className="mt-4 leading-7 text-gray-600">
              सरल, व्यवस्थित और परिवार-केंद्रित matrimonial experience
              उपलब्ध कराना ताकि रिश्ता तलाशने की प्रक्रिया आसान हो।
            </p>
          </div>

        </div>

        {/* CTA */}
        <div className="mt-12 text-center">

          <h2 className="text-3xl font-bold text-red-900">
            अपने लिए उपयुक्त रिश्ता तलाशें
          </h2>

          <p className="mt-3 text-gray-600">
            NNVS Matrimony पर उपलब्ध profiles देखें।
          </p>

          <div className="mt-7 flex flex-col justify-center gap-4 sm:flex-row">

            <Link
              href="/profiles"
              className="rounded-xl bg-red-900 px-8 py-3 font-semibold text-white transition hover:bg-red-800"
            >
              Browse Profiles
            </Link>

            <Link
              href="/register"
              className="rounded-xl border-2 border-red-900 px-8 py-3 font-semibold text-red-900 transition hover:bg-red-50"
            >
              Register
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}