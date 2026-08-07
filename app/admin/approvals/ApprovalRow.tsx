"use client";

interface ApprovalRowProps {
  profile: any;
  refresh: () => void;
}

export default function ApprovalRow({
  profile,
  refresh,
}: ApprovalRowProps) {
  async function updateStatus(
    action: "APPROVE" | "REJECT"
  ) {
    try {
      const res = await fetch(
        `/api/admin/approvals/${profile.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      alert(data.message);

      refresh();

    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  return (
    <tr className="border-b hover:bg-gray-50">

      <td className="px-4 py-3">
        {profile.profileId}
      </td>

      <td className="px-4 py-3 font-medium">
        {profile.user?.fullName}
      </td>

      <td className="px-4 py-3">
        {profile.user?.mobile}
      </td>

      <td className="px-4 py-3">
        {profile.user?.gender}
      </td>

      <td className="px-4 py-3">
        {profile.education?.highestQualification || "-"}
      </td>

      <td className="px-4 py-3">
        {profile.occupation?.profession || "-"}
      </td>

      <td className="px-4 py-3">

        <div className="flex gap-2">

          <button
            onClick={() => updateStatus("APPROVE")}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Approve
          </button>

          <button
            onClick={() => updateStatus("REJECT")}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Reject
          </button>

        </div>

      </td>

    </tr>
  );
}