import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { routeApi } from '../services/api';
import RouteCard from '../components/RouteCard.jsx';
import ComparisonTable from '../components/ComparisonTable.jsx';

export default function RouteResults() {
  const { id } = useParams();
  const [search, setSearch] = useState(null);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [sortBy, setSortBy] = useState('overall');

  useEffect(() => {
    routeApi.get(id).then(setSearch).catch((err) => setError(err.response?.data?.message || 'Failed to load'));
  }, [id]);

  const handleFavorite = async (routeOptionId) => {
    try {
      await routeApi.favorite(id, routeOptionId);
      alert('Saved to favorites');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save favorite');
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    setAsking(true);
    setAnswer('');
    try {
      const res = await routeApi.chat(id, question);
      setAnswer(res.answer);
    } catch (err) {
      setAnswer(err.response?.data?.message || 'Could not get an answer right now.');
    } finally {
      setAsking(false);
    }
  };

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!search) return <div className="p-8 text-center">Loading routes...</div>;

  const sorted = [...search.options].sort((a, b) => b.scores[sortBy] - a.scores[sortBy]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/" className="text-sm text-brand-600 hover:underline">← New search</Link>
          <h1 className="text-2xl font-semibold mt-1">
            {search.source.address} → {search.destination.address}
          </h1>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded-lg px-3 py-2 dark:bg-gray-700">
          <option value="overall">Sort: Overall</option>
          <option value="speed">Sort: Fastest</option>
          <option value="budget">Sort: Cheapest</option>
          <option value="safety">Sort: Safest</option>
          <option value="scenic">Sort: Scenic</option>
          <option value="food">Sort: Food</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {sorted.map((option) => (
          <RouteCard key={option._id} option={option} searchId={search._id} onFavorite={handleFavorite} />
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Compare routes</h2>
        <ComparisonTable options={search.options} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Ask about these routes</h2>
        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Which route has the best food options?"
            className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700"
            required
          />
          <button
            type="submit"
            disabled={asking}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {asking ? 'Thinking...' : 'Ask'}
          </button>
        </form>
        {answer && <p className="mt-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-sm">{answer}</p>}
      </div>
    </div>
  );
}
