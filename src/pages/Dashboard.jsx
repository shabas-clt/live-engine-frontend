import { useState, useEffect } from 'react';
import { Activity, Database, Key, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        api.get('/health'),
        api.get('/api/tokens/stats'),
      ]);
      setHealth(healthRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const healthyTokens = stats.filter((s) => s.is_healthy).length;
  const totalRequests = stats.reduce((sum, s) => sum + s.daily_requests, 0);
  const totalBandwidth = stats.reduce((sum, s) => sum + s.monthly_bandwidth_mb, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor your data engine performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Key}
          label="Active Tokens"
          value={`${healthyTokens} / ${stats.length}`}
          color="blue"
        />
        <StatCard
          icon={Activity}
          label="Requests Today"
          value={totalRequests.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Bandwidth (Month)"
          value={`${totalBandwidth.toFixed(1)} MB`}
          color="purple"
        />
        <StatCard
          icon={Database}
          label="Database"
          value={health?.database?.timescaledb === 'connected' ? 'Connected' : 'Disconnected'}
          color={health?.database?.timescaledb === 'connected' ? 'green' : 'red'}
        />
      </div>

      {/* Collection Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Collection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CollectionStatus asset="Bitcoin" enabled={health?.collection?.bitcoin} />
          <CollectionStatus asset="Gold" enabled={health?.collection?.gold} />
          <CollectionStatus asset="Silver" enabled={health?.collection?.silver} />
        </div>
      </div>

      {/* Token Usage */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Token Usage</h2>
        <div className="space-y-4">
          {stats.map((token) => (
            <TokenUsageBar key={token.token_id} token={token} />
          ))}
          {stats.length === 0 && (
            <p className="text-gray-500 text-center py-8">No tokens configured</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const CollectionStatus = ({ asset, enabled }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <span className="font-medium text-gray-900">{asset}</span>
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
      }`}
    >
      {enabled ? 'Active' : 'Inactive'}
    </span>
  </div>
);

const TokenUsageBar = ({ token }) => {
  const getColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-gray-900">{token.name}</span>
          {token.assigned_to && (
            <span className="ml-2 text-sm text-gray-500">({token.assigned_to})</span>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            token.is_healthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {token.is_healthy ? 'Healthy' : 'Limited'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Hourly</span>
            <span className="font-medium">
              {token.hourly_requests}/{token.hourly_limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getColor(token.hourly_percentage)}`}
              style={{ width: `${Math.min(token.hourly_percentage, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Daily</span>
            <span className="font-medium">
              {token.daily_requests}/{token.daily_limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getColor(token.daily_percentage)}`}
              style={{ width: `${Math.min(token.daily_percentage, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Bandwidth</span>
            <span className="font-medium">
              {token.monthly_bandwidth_mb.toFixed(0)}/
              {token.monthly_bandwidth_limit_mb.toFixed(0)} MB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getColor(token.bandwidth_percentage)}`}
              style={{ width: `${Math.min(token.bandwidth_percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
