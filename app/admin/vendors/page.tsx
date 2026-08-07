import VendorFilter from "./VendorFilter";
import VendorTable from "./VendorTable";

async function getVendors() {
  try {
    const res = await fetch(
      "http://localhost:3000/api/admin/vendors",
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return [];
    }

    const data = await res.json();

    return data.vendors || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">
          Vendors
        </h1>

        <p className="mt-2 text-gray-500">
          Manage all registered vendors.
        </p>

      </div>

      <VendorFilter />

      <VendorTable
        vendors={vendors}
      />

    </div>
  );
}