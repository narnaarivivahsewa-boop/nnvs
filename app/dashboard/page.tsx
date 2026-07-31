export default function Dashboard() {
  return (
    <div className="p-10">

      <h1 className="text-4xl font-bold mb-10">
        Member Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="border rounded-xl p-6">
          ⭐ Featured Profile
        </div>

        <div className="border rounded-xl p-6">
          🚀 Boost Profile
        </div>

        <div className="border rounded-xl p-6">
          🔓 Contact Unlock
        </div>

        <div className="border rounded-xl p-6">
          ❤️ Premium Membership
        </div>

        <div className="border rounded-xl p-6">
          🛡 Verification
        </div>

        <div className="border rounded-xl p-6">
          💍 Wedding Vendors
        </div>

      </div>

    </div>
  );
}