import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const Tokens = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingToken, setEditingToken] = useState(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await api.get('/tokens');
      setTokens(response.data);
    } catch (error) {
      toast.error('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tokenId, tokenName) => {
    if (!confirm(`Delete token "${tokenName}"?`)) return;

    try {
      await api.delete(`/tokens/${tokenId}`);
      toast.success('Token deleted successfully');
      fetchTokens();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete token');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tokens</h1>
          <p className="text-gray-600 mt-1">Manage your Tiingo API tokens</p>
        </div>
        <button
          onClick={() => {
            setEditingToken(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          Add Token
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Token
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usage
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tokens.map((token) => (
              <tr key={token.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{token.name}</p>
                    {token.description && (
                      <p className="text-sm text-gray-500">{token.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{token.token}</code>
                </td>
                <td className="px-6 py-4">
                  {token.assigned_to ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {token.assigned_to}
                    </span>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      token.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : token.status === 'rate_limited'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {token.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div>Hourly: {token.hourly_requests}/50</div>
                    <div>Daily: {token.daily_requests}/1000</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(token.id, token.name)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tokens.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tokens configured. Add your first token to get started.
          </div>
        )}
      </div>

      {showModal && (
        <TokenModal
          token={editingToken}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchTokens();
          }}
        />
      )}
    </div>
  );
};

const TokenModal = ({ token, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    token: token?.token || '',
    name: token?.name || '',
    description: token?.description || '',
    assigned_to: token?.assigned_to || '',
  });
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (token) {
        await api.patch(`/tokens/${token.id}`, formData);
        toast.success('Token updated successfully');
      } else {
        await api.post('/tokens', formData);
        toast.success('Token added successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {token ? 'Edit Token' : 'Add Token'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none pr-10"
                placeholder="Your Tiingo API token"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Token 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Primary token for BTC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To (Optional)
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Unassigned</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : token ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tokens;
