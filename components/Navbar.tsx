export default function Navbar() {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        <div>
          <h1 className="text-2xl font-bold text-red-900">
            NNVS MATRIMONY
          </h1>
          <p className="text-sm text-gray-500">
            समाज के प्रति एक सेवा
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="text-gray-700 hover:text-red-900">
            Home
          </a>

          <a href="#" className="text-gray-700 hover:text-red-900">
            Profiles
          </a>

          <a href="#" className="text-gray-700 hover:text-red-900">
            About
          </a>

          <button className="border border-red-900 text-red-900 px-5 py-2 rounded-lg hover:bg-red-50">
            Login
          </button>

          <button className="bg-red-900 text-white px-5 py-2 rounded-lg hover:bg-red-800">
            Register
          </button>
        </div>

      </div>
    </nav>
  );
}