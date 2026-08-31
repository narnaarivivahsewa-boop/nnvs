import { prisma } from "@/lib/prisma";
import VendorFilter from "./VendorFilter";
import VendorTable from "./VendorTable";

async function getVendors() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: true,
        galleries: true,
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return vendors;
  } catch (error) {
    console.error("Failed to fetch vendors:", error);
    return [];
  }
}

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Vendors
        </h1>
        <p className="mt-2 text-gray-500">
          Manage all registered wedding vendors and services.
        </p>
      </div>

      <VendorFilter />

      <VendorTable vendors={vendors} />
    </div>
  );
}