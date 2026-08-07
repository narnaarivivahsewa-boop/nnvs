import ApprovalRow from "./ApprovalRow";

interface ApprovalTableProps {
  profiles: any[];
  refresh: () => void;
}

export default function ApprovalTable({
  profiles,
  refresh,
}: ApprovalTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow">

      <table className="min-w-full">

        <thead className="bg-red-700 text-white">

          <tr>

            <th className="px-4 py-3 text-left">
              Profile ID
            </th>

            <th className="px-4 py-3 text-left">
              Name
            </th>

            <th className="px-4 py-3 text-left">
              Mobile
            </th>

            <th className="px-4 py-3 text-left">
              Gender
            </th>

            <th className="px-4 py-3 text-left">
              Qualification
            </th>

            <th className="px-4 py-3 text-left">
              Profession
            </th>

            <th className="px-4 py-3 text-left">
              Action
            </th>

          </tr>

        </thead>

        <tbody>

          {profiles.length === 0 ? (

            <tr>

              <td
                colSpan={7}
                className="py-10 text-center text-gray-500"
              >
                No Pending Profiles
              </td>

            </tr>

          ) : (

            profiles.map((profile: any) => (

              <ApprovalRow
                key={profile.id}
                profile={profile}
                refresh={refresh}
              />

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}