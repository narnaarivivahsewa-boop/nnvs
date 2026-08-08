export default function SearchBox() {
  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
  ];

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6">

        <div className="rounded-3xl bg-white p-8 shadow-xl">

          <h2 className="text-center text-4xl font-bold text-red-900">
            Find Your Match
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-4">

            <select
              className="rounded-lg border p-3"
              defaultValue=""
            >
              <option value="" disabled>
                I'm Looking For
              </option>
              <option value="FEMALE">
                Bride
              </option>
              <option value="MALE">
                Groom
              </option>
            </select>

            <select
              className="rounded-lg border p-3"
              defaultValue=""
            >
              <option value="" disabled>
                Age
              </option>
              <option value="18-25">
                18-25
              </option>
              <option value="26-30">
                26-30
              </option>
              <option value="31-35">
                31-35
              </option>
              <option value="36-40">
                36-40
              </option>
              <option value="41-50">
                41-50
              </option>
              <option value="51+">
                51+
              </option>
            </select>

            <select
              className="rounded-lg border p-3"
              defaultValue=""
            >
              <option value="" disabled>
                State
              </option>

              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="rounded-lg bg-red-900 p-3 font-semibold text-white transition hover:bg-red-800"
            >
              Search Profiles
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}