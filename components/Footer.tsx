export default function Footer() {
  return (
    <footer className="bg-red-950 text-white mt-20">

      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">

        <div>
          <h2 className="text-3xl font-bold">
            NNVS MATRIMONY
          </h2>

          <p className="mt-4 text-gray-300 leading-7">
            समाज के प्रति एक सेवा
            <br />
            A trusted matrimonial platform helping families
            find genuine life partners.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">
            Quick Links
          </h3>

          <ul className="space-y-3 text-gray-300">
            <li>Home</li>
            <li>Profiles</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">
            Support
          </h3>

          <ul className="space-y-3 text-gray-300">
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
            <li>FAQs</li>
            <li>Help Center</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">
            Contact
          </h3>

          <p className="text-gray-300">
            📞 +91 9871592002
          </p>

          <p className="mt-2 text-gray-300">
            📞 +91 7015812359
          </p>

          <p className="mt-2 text-gray-300">
            🕠 Calling Time
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