interface VendorRowProps {
  vendor: any;
}

export default function VendorRow({
  vendor,
}: VendorRowProps) {
  return (
    <tr className="border-b hover:bg-gray-50">

      <td className="px-4 py-3 font-medium">
        {vendor.businessName}
      </td>

      <td className="px-4 py-3">
        {vendor.category || "-"}
      </td>

      <td className="px-4 py-3">
        {vendor.phone}
      </td>

      <td className="px-4 py-3">
        {vendor.city || "-"}
      </td>

      <td className="px-4 py-3">
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            vendor.status === "APPROVED"
              ? "bg-green-100 text-green-700"
              : vendor.status === "REJECTED"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {vendor.status}
        </span>
      </td>

      <td className="px-4 py-3">
        {vendor.isVerified ? (
          <span className="text-green-600 font-semibold">
            Yes
          </span>
        ) : (
          <span className="text-red-600">
            No
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        {vendor.reviews?.length || 0}
      </td>

    </tr>
  );
}