const ROWS = [
  { key: 'distanceMeters', label: 'Distance', format: (v) => `${(v / 1000).toFixed(1)} km` },
  { key: 'durationInTrafficSeconds', label: 'Time (traffic)', format: (v) => `${Math.round(v / 60)} min` },
  { key: 'estimatedFuelCost', label: 'Fuel cost', format: (v) => `₹${v}` },
  { key: 'estimatedTollCost', label: 'Toll cost', format: (v) => `₹${v}` },
  { key: 'roadQualityScore', label: 'Road quality', format: (v) => `${v}/100` },
  { key: 'safetyScore', label: 'Safety', format: (v) => `${v}/100` },
];

const SCORE_ROWS = ['speed', 'budget', 'comfort', 'safety', 'food', 'scenic', 'adventure', 'overall'];

export default function ComparisonTable({ options }) {
  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left p-3">Metric</th>
            {options.map((o) => (
              <th key={o._id} className="text-left p-3">{o.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key} className="border-b dark:border-gray-700">
              <td className="p-3 text-gray-500">{row.label}</td>
              {options.map((o) => (
                <td key={o._id} className="p-3">{row.format(o[row.key])}</td>
              ))}
            </tr>
          ))}
          {SCORE_ROWS.map((key) => (
            <tr key={key} className="border-b dark:border-gray-700">
              <td className="p-3 text-gray-500 capitalize">{key} score</td>
              {options.map((o) => (
                <td key={o._id} className="p-3 font-medium">{o.scores[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
