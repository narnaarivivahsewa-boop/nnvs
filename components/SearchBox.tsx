export default function SearchBox() {
  return (
    <section className="-mt-10 relative z-10">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-center text-red-900 mb-8">
          Find Your Match
        </h2>

        <div className="grid md:grid-cols-4 gap-4">
          <select className="border rounded-lg p-3">
            <option>I'm Looking For</option>
            <option>Bride</option>
            <option>Groom</option>
          </select>

          <select className="border rounded-lg p-3">
            <option>Age</option>
            <option>18-25</option>
            <option>26-30</option>
            <option>31-35</option>
          </select>

          <select className="border rounded-lg p-3">
            <option>State</option>
            <option>Haryana</option>
            <option>Delhi</option>
            <option>Punjab</option>
          </select>

          <button className="bg-red-900 text-white rounded-lg p-3">
            Search Profiles
          </button>
        </div>
      </div>
    </section>
  );
}