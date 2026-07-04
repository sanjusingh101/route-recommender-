import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white dark:bg-gray-800 p-8 rounded-xl shadow">
        <h1 className="text-2xl font-semibold mb-6">Create account</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <label className="block text-sm mb-1">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg dark:bg-gray-700"
        />
        <label className="block text-sm mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg dark:bg-gray-700"
        />
        <label className="block text-sm mb-1">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2 border rounded-lg dark:bg-gray-700"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {submitting ? 'Creating account...' : 'Register'}
        </button>
        <p className="text-sm mt-4 text-center">
          Already have an account? <Link to="/login" className="text-brand-600">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
