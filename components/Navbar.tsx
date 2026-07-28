import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
        <div>
          <Link href="/">
            <h1 className="text-2xl font-bold text-red-900 cursor-pointer">
              NNVS MATRIMONY
            </h1>
          </Link>

          <p className="text-sm text-gray-500">
            समाज के प्रति एक सेवा
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-700 hover:text-red-900"
          >
            Home
          </Link>

          <Link
            href="/profiles"
            className="text-gray-700 hover:text-red-900"
          >
            Profiles
          </Link>

          <Link
            href="/about"
            className="text-gray-700 hover:text-red-900"
          >
            About
          </Link>

          <Link
            href="/login"
            className="border border-red-900 text-red-900 px-5 py-2 rounded-lg hover:bg-red-50 transition"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="bg-red-900 text-white px-5 py-2 rounded-lg hover:bg-red-800 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}