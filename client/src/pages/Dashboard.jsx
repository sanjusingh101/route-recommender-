import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routeApi } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

const initialPrefs = {
  vehicle: 'car',
  tripType: 'solo',
  fuelEfficiencyKmpl: 15,
  maxDrivingHours: 4,
  departureTime: '',
  priorities: { fastest: 1, cheapest: 1, comfort: 1, safety: 1, food: 0.5, scenic: 0.5, adventure: 0.3 },
  avoid: { tolls: false, highways: false, ferries: false },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [prefs, setPrefs] = useState(initialPrefs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updatePriority = (key, value) =>
    setPrefs((p) => ({ ...p, priorities: { ...p.priorities, [key]: Number(value) } }));

  const updateAvoid = (key) => setPrefs((p) => ({ ...p, avoid: { ...p.avoid, [key]: !p.avoid[key] } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const search = await routeApi.search({
        source: { address: source },
        destination: { address: destination },
        preferences: prefs,
      });
      navigate(`/results/${search._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Route search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Hi, {user?.name}</h1>
        <button onClick={logout} className="text-sm text-gray-500 hover:underline">
          Logout
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Source</label>
            <input
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Jaipur, India"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Destination</label>
            <input
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Udaipur, India"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Vehicle</label>
            <select
              value={prefs.vehicle}
              onChange={(e) => setPrefs((p) => ({ ...p, vehicle: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
              <option value="truck">Truck</option>
              <option value="ev">EV</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Trip type</label>
            <select
              value={prefs.tripType}
              onChange={(e) => setPrefs((p) => ({ ...p, tripType: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            >
              <option value="solo">Solo</option>
              <option value="family">Family</option>
              <option value="friends">Friends</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Departure time</label>
            <input
              type="datetime-local"
              value={prefs.departureTime}
              onChange={(e) => setPrefs((p) => ({ ...p, departureTime: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Priorities (0 = don't care, 3 = very important)</p>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(prefs.priorities).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs capitalize mb-1">{key}</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.5"
                  value={value}
                  onChange={(e) => updatePriority(key, e.target.value)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Avoid</p>
          <div className="flex gap-4">
            {Object.entries(prefs.avoid).map(([key, checked]) => (
              <label key={key} className="flex items-center gap-2 text-sm capitalize">
                <input type="checkbox" checked={checked} onChange={() => updateAvoid(key)} />
                {key}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Collecting and scoring routes...' : 'Find best routes'}
        </button>
      </form>
    </div>
  );
}
