interface Option {
  value: string
  label: string
  color?: string
}

interface SelectProps {
  options: Option[]
  showStatusDot?: boolean

  // modo tabela
  info?: any

  // modo formulário
  value?: string
  onChange?: (value: string) => void
}

export default function Select({
  info,
  value,
  onChange,
  options,
  showStatusDot = false
}: SelectProps) {

  const currentValue = info ? info.getValue() : value

  const currentOption = options.find((o) => o.value === currentValue)

  const handleChange = (val: string) => {
    if (info) {
      info.table.options.meta?.updateData(info.row.index, val)
    }

    if (onChange) {
      onChange(val)
    }
  }

  return (
    <div className="relative inline-flex items-center">

      {showStatusDot && currentOption?.color && (
        <span
          className="absolute left-3 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: currentOption.color }}
        />
      )}

      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        className={`appearance-none cursor-pointer text-[12px] text-gray-700 bg-white px-3 py-2 pr-8 rounded-md font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all min-w-[160px]
        ${showStatusDot ? "pl-8" : ""}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute right-2 text-gray-400 text-xs">
        ▼
      </span>

    </div>
  )
}