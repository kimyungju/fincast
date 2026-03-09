const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  hot: { color: "bg-red-500", bg: "bg-red-500/10", label: "Hot" },
  warming: { color: "bg-orange-1", bg: "bg-orange-1/10", label: "Warming" },
  stable: { color: "bg-yellow-400", bg: "bg-yellow-400/10", label: "Stable" },
  cooling: { color: "bg-blue-400", bg: "bg-blue-400/10", label: "Cooling" },
  dormant: { color: "bg-gray-400", bg: "bg-gray-400/10", label: "Dormant" },
};

const ThemeBadge = ({
  status,
  label,
  size = "sm",
}: {
  status: string;
  label?: string;
  size?: "sm" | "md";
}) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.dormant;
  const displayLabel = label ?? config.label;

  if (size === "md") {
    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 border-4 border-mid-gray ${config.bg}`}
      >
        <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
        <span className="text-12 font-bold uppercase tracking-wider text-white-1">
          {displayLabel}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border-2 ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      <span className="text-10 font-bold uppercase tracking-wider text-white-1">
        {displayLabel}
      </span>
    </span>
  );
};

export default ThemeBadge;
