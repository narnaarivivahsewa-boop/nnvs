interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: string;
  color?: string;
}

export default function DashboardCard({
  title,
  value,
  icon,
  color = "bg-red-700",
}: DashboardCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow transition hover:shadow-lg">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-bold text-gray-800">
            {value}
          </h2>

        </div>

        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white ${color}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}