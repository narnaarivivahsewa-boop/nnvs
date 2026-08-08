import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-red-950 text-white">

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">

        {/* Brand */}
        <div>
          <Link
            href="/#top"
            className="text-3xl font-bold hover:text-red-200"
          >
            NNVS MATRIMONY
          </Link>

          <p className="mt-4 leading-7 text-gray-300">
            समाज के प्रति एक सेवा
            <br />
            A trusted matrimonial platform helping families
            find genuine life partners.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-xl font-semibold">
            Quick Links
          </h3>

          <ul className="space-y-3 text-gray-300">

            <li>
              <Link
                href="/#top"
                className="transition hover:text-white"
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                href="/profiles"
                className="transition hover:text-white"
              >
                Profiles
              </Link>
            </li>

            <li>
              <Link
                href="/about"
                className="transition hover:text-white"
              >
                About
              </Link>
            </li>

            <li>
  <Link
    href="/contact"
    className="transition hover:text-white"
  >
    Contact
  </Link>
</li>

          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="mb-4 text-xl font-semibold">
            Support
          </h3>

          <ul className="space-y-3 text-gray-300">

            <li>
              <Link
                href="/privacy"
                className="transition hover:text-white"
              >
                Privacy Policy
              </Link>
            </li>

            <li>
              <Link
                href="/terms"
                className="transition hover:text-white"
              >
                Terms & Conditions
              </Link>
            </li>

            <li>
              <Link
                href="/faqs"
                className="transition hover:text-white"
              >
                FAQs
              </Link>
            </li>

            <li>
              <Link
                href="/help"
                className="transition hover:text-white"
              >
                Help Center
              </Link>
            </li>

          </ul>
        </div>

        {/* Contact */}
<div id="contact">
  <h3 className="mb-4 text-xl font-semibold">
    Contact
  </h3>

  <p className="text-gray-300">
    ✉️ narnaarivivahsewa@gmail.com
  </p>

  <p className="mt-3 text-gray-300">
    📞 +91 9871592002
  </p>

  <p className="mt-2 text-gray-300">
    📞 +91 7015812359
  </p>

  <p className="mt-3 text-gray-300">
    🕐 Calling Time
    <br />
    5:30 PM – 7:30 PM
  </p>
</div>

      </div>

      <div className="border-t border-red-800 py-5 text-center text-gray-400">
        © 2026 NNVS MATRIMONY. All Rights Reserved.
      </div>

    </footer>
  );
}