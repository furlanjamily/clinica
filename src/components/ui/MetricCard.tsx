import { IconCurrencyDollar } from "@tabler/icons-react";

export function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="w-[240px] h-[98px] p-4 bg-white border border-[#E6E6E6] rounded-[8px] shadow-sm">
      <div className="flex items-center gap-4 text-[#9747FF] mb-4">
        <IconCurrencyDollar size={16} stroke={2.5} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <h3 className="text-[20px] font-bold text-[#5B5B5B]">{value}</h3>
    </div>
  );
}
