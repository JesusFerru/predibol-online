interface StatsCardProps {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "accent";
}

export function StatsCard({
  label,
  value,
  helper,
  tone = "default",
}: StatsCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold tabular-nums ${
          tone === "accent" ? "text-crimson" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}
