import VendorRow from "./VendorRow";

interface VendorTableProps {
  vendors: any[];
}

export default function VendorTable({
  vendors,
}: VendorTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow">

      <table className="min-w-full">

        <thead className="bg-red-700 text-white">

          <tr>

            <th className="px-4 py-3 text-left">
              Business
            </th>

            <th className="px-4 py-3 text-left">
              Category
            </th>

            <th className="px-4 py-3 text-left">
              Phone
            </th>

            <th className="px-4 py-3 text-left">
              City
            </th>

            <th className="px-4 py-3 text-left">
              Status
            </th>

            <th className="px-4 py-3 text-left">
              Verified
            </th>

            <th className="px-4 py-3 text-left">
              Reviews
            </th>

          </tr>

        </thead>

        <tbody>

          {vendors.length === 0 ? (
            <tr>

              <td
                colSpan={7}
                className="py-10 text-center text-gray-500"
              >
                No Vendors Found
              </td>

            </tr>
          ) : (
            vendors.map((vendor) => (
              <VendorRow
                key={vendor.id}
                vendor={vendor}
              />
            ))
          )}

        </tbody>

      </table>

    </div>
  );
}