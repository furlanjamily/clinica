export function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  const widths = ["60%", "70%", "80%", "90%"]

  return (
    <table className="w-full border-separate border-spacing-y-2">
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-3 py-2">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="bg-white shadow-sm">
            {Array.from({ length: cols }).map((_, j) => (
              <td key={j} className="p-3">
                <div
                  className="h-3 bg-gray-100 rounded animate-pulse"
                  style={{
                    width: widths[(i + j) % widths.length], // 🔥 determinístico
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}