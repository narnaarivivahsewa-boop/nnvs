export default function SettingsPage() {
  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-8">
        Business Settings
      </h1>

      <div className="space-y-4">

        <input
          placeholder="Male Registration Fee"
          className="border p-3 w-full rounded-xl"
        />

        <input
          placeholder="Female Registration Fee"
          className="border p-3 w-full rounded-xl"
        />

        <input
          placeholder="GST %"
          className="border p-3 w-full rounded-xl"
        />

        <input
          placeholder="Featured Profile Price"
          className="border p-3 w-full rounded-xl"
        />

        <input
          placeholder="Boost Price"
          className="border p-3 w-full rounded-xl"
        />

        <input
          placeholder="Contact Unlock Price"
          className="border p-3 w-full rounded-xl"
        />

      </div>

    </div>
  );
}