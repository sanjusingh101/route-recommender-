export default function RouteCard({ option, searchId, onFavorite }) {
  const km = (option.distanceMeters / 1000).toFixed(1);
  const mins = Math.round(option.durationInTrafficSeconds / 60);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{option.label}</h3>
          <p className="text-sm text-gray-500">{option.summary}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-brand-600">{option.scores.overall}</div>
          <div className="text-xs text-gray-500">Overall score</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <Stat label="Distance" value={`${km} km`} />
        <Stat label="Time (traffic)" value={`${mins} min`} />
        <Stat label="Fuel cost" value={`₹${option.estimatedFuelCost}`} />
        <Stat label="Toll cost" value={`₹${option.estimatedTollCost}`} />
        <Stat label="Road quality" value={`${option.roadQualityScore}/100`} />
        <Stat label="Safety" value={`${option.safetyScore}/100`} />
      </div>

      {option.weather?.condition && option.weather.condition !== 'Unavailable' && (
        <p className="text-xs text-gray-500">
          Weather near destination: {option.weather.condition} ({option.weather.tempC}°C)
        </p>
      )}

      {option.aiExplanation && (
        <p className="text-sm bg-brand-50 dark:bg-gray-700 p-3 rounded-lg">{option.aiExplanation}</p>
      )}

      <div className="flex flex-wrap gap-1">
        {['restaurant', 'hotel', 'fuel', 'hospital', 'police'].map((type) => {
          const count = option.places.filter((p) => p.type === type).length;
          if (!count) return null;
          return (
            <span key={type} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full capitalize">
              {count} {type}
            </span>
          );
        })}
      </div>

      <button
        onClick={() => onFavorite(option._id)}
        className="text-sm text-brand-600 hover:underline"
      >
        Save as favorite
      </button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
