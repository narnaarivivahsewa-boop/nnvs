export default function Stats() {
  return (
    <section className="bg-gray-100 pb-20">

      <div className="max-w-7xl mx-auto px-6">

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-5xl font-bold text-pink-600">1128</h2>
            <p className="mt-2 text-gray-600">Girls Profiles</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-5xl font-bold text-blue-600">358</h2>
            <p className="mt-2 text-gray-600">Boys Profiles</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-5xl font-bold text-green-600">1486</h2>
            <p className="mt-2 text-gray-600">Total Profiles</p>
          </div>

        </div>

      </div>

    </section>
  );
}