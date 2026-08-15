import Link from "next/link";

export default function Navbar() {
  return (
    <>
      <nav className="w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-[112px] items-center justify-between px-6 lg:px-10">

          {/* NNVS LOGO */}
          <Link href="/" className="flex items-center">
            <img
  src="/nnvs-logo.png"
  alt="NNVS Matrimony"
  className="h-[105px] w-auto object-contain"
/>
          </Link>

          {/* NAVIGATION */}
          <div className="flex items-center gap-8">

            <Link
              href="/"
              className="text-lg font-medium text-gray-700 hover:text-red-900"
            >
              Home
            </Link>

            <Link
              href="/profiles"
              className="text-lg font-medium text-gray-700 hover:text-red-900"
            >
              Profiles
            </Link>

            <Link
              href="/about"
              className="text-lg font-medium text-gray-700 hover:text-red-900"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="text-lg font-medium text-gray-700 hover:text-red-900"
            >
              Contact
            </Link>

            <Link
              href="/login"
              className="rounded-full border-2 border-red-800 px-8 py-3 text-lg font-semibold text-red-800 hover:bg-red-50"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-red-800 px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-red-900"
            >
              Register
            </Link>

          </div>
        </div>
      </nav>

      {/* JAI SHREE SHYAM */}
      <div className="w-full bg-white py-2 text-center">
        <p className="text-xl font-semibold tracking-wide text-red-900">
          🙏 जय श्री श्याम 🙏
        </p>
      </div>
    </>
  );
}