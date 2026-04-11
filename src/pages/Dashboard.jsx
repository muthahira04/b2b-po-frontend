import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance.jsx';
import { ShoppingCart, Clock, CheckCircle, Package, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [monthlySpend, setMonthlySpend] = useState([]);
  const [loading, setLoading] = useState(true);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/po/stats');
        setStats(res.data.stats);
        const formatted = res.data.monthlySpend.map(item => ({
          month: months[item._id.month - 1],
          spend: item.spend
        }));
        setMonthlySpend(formatted);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total POs"
          value={stats?.totalPOs || 0}
          icon={<ShoppingCart size={22} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Pending Approval"
          value={stats?.pendingPOs || 0}
          icon={<Clock size={22} className="text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          title="Approved"
          value={stats?.approvedPOs || 0}
          icon={<CheckCircle size={22} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Fulfilled"
          value={stats?.fulfilledPOs || 0}
          icon={<Package size={22} className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* Total Spend */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-50">
            <TrendingUp size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Spend</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{stats?.totalSpend?.toLocaleString('en-IN') || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Spend Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spend</h2>
        {monthlySpend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySpend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spend']} />
              <Bar dataKey="spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">
            No spend data available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;