import Link from "next/link";

export default function Navbar() {
  return (
    <>
      <nav className="w-full border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <Link
              href="/"
              className="text-2xl font-bold text-red-900"
            >
              NNVS MATRIMONY
            </Link>

            <p className="text-sm text-gray-500">
              समाज के प्रति एक सेवा
            </p>
          </div>

          <div className="flex items-center gap-4">

            <Link
              href="/"
              className="text-gray-700 transition hover:text-red-900"
            >
              Home
            </Link>

            <Link
              href="/profiles"
              className="text-gray-700 transition hover:text-red-900"
            >
              Profiles
            </Link>

            <Link
              href="/about"
              className="text-gray-700 transition hover:text-red-900"
            >
              About
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-red-900 px-5 py-2 text-red-900 transition hover:bg-red-50"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-red-900 px-5 py-2 text-white transition hover:bg-red-800"
            >
              Register
            </Link>

          </div>

        </div>
      </nav>

      {/* Jai Shree Shyam */}
      <div className="w-full bg-white py-4 text-center">
        <p className="text-xl font-semibold tracking-wide text-red-900">
          🙏 जय श्री श्याम 🙏
        </p>
      </div>
    </>
  );
}