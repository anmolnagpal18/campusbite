import { useState, useEffect } from 'react';
import axiosClient from '../../config/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader } from '../../components/Loader';
import toast from 'react-hot-toast';

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axiosClient.get('/analytics/university/');
        setMetrics(res.data);
        
        // Fetch AI Insights in parallel
        const aiRes = await axiosClient.get('/analytics/insights/');
        setInsights(aiRes.data.insights);
      } catch (err) {
        toast.error("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader /></div>;
  if (!metrics) return <div className="p-10 text-center">No snapshot data available.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">University Analytics</h1>
          <p className="text-slate-500">Live operational data and AI-driven business intelligence.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow font-medium">
          Export PDF
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{metrics.total_revenue}</p>
          <span className="text-sm text-green-500 font-semibold mt-2 block">↑ 12% vs last week</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.total_orders}</p>
          <span className="text-sm text-green-500 font-semibold mt-2 block">↑ 18% vs last week</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 mb-1">Avg Order Value</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{metrics.average_order_value}</p>
        </div>
      </div>

      {/* Charts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Wrapper */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Revenue & Order Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.trend_data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">✨</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Insights</h3>
          </div>
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 text-sm text-indigo-900 dark:text-indigo-200">
                {insight}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
