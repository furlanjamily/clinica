type CustomTooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: string;
};

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">
          R$ {payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }

  return null;
}
