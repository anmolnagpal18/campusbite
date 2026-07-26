import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboard';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import {
  Store, RefreshCw, Download, Printer, BarChart2, ArrowLeft, Users, ChefHat, Timer
} from 'lucide-react';
import { RevenueLineChart, StatusPieChart } from '../components/common/DashboardCharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export const CollegeAdminAnalytics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Time filters
  const [rangePreset, setRangePreset] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // Drill-down State
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchVal, setSearchVal] = useState('');

  const refreshIntervalRef = useRef(null);

  const fetchStats = async (preset = rangePreset, start = startDate, end = endDate) => {
    setLoadingStats(true);
    try {
      const res = await dashboardService.getCollegeAdminStats(preset, start, end);
      if (res) {
        setStats(res);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics data.');
    } finally {
      setLoadingStats(false);
    }
  };

  // Setup auto-refresh every 60 seconds
  useEffect(() => {
    fetchStats(rangePreset, startDate, endDate);

    refreshIntervalRef.current = setInterval(() => {
      fetchStats(rangePreset, startDate, endDate);
    }, 60000); // 60 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [rangePreset, startDate, endDate]);

  const handleExport = async (format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} report...`);
      await dashboardService.downloadReport('college', format, rangePreset, startDate, endDate);
      toast.dismiss();
      toast.success(`${format.toUpperCase()} report generated successfully!`);
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export report.');
    }
  };

  const restaurantHeaders = [
    { label: 'Restaurant' },
    { label: 'Vendor' },
    { label: 'Today\'s Orders' },
    { label: 'Completed %' },
    { label: 'Cancelled %' },
    { label: 'Revenue' },
    { label: 'Staff' },
    { label: 'Accepting Orders' },
    { label: 'Actions', className: 'text-right' }
  ];

  const summary = stats?.summary || {};
  const restaurantsTable = stats?.tables?.restaurants || [];

  const filteredRestaurants = restaurantsTable.filter(r =>
    r.restaurant.toLowerCase().includes(searchVal.toLowerCase()) ||
    r.vendor.toLowerCase().includes(searchVal.toLowerCase())
  );

  // Drill-down subview rendering
  if (selectedRestaurant) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Breadcrumb & Navigation Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121020]/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
              <span className="cursor-pointer hover:text-purple-400" onClick={() => setSelectedRestaurant(null)}>Restaurant Analytics</span>
              <span>&gt;</span>
              <span className="text-purple-400">{selectedRestaurant.restaurant}</span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-100 uppercase tracking-widest">{selectedRestaurant.restaurant} Analytics</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedRestaurant(null)}
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
          >
            Back to Analytics
          </Button>
        </div>

        {/* Operational Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Today's Orders" 
            value={selectedRestaurant.today_orders} 
            icon={<ChefHat className="h-6 w-6 text-purple-400" />} 
          />
          <StatCard 
            title="Total Revenue (Range)" 
            value={`₹${selectedRestaurant.revenue?.toFixed(2)}`} 
            icon={<Store className="h-6 w-6 text-emerald-400" />} 
          />
          <StatCard 
            title="Average Order Value" 
            value={`₹${selectedRestaurant.average_order_value?.toFixed(2)}`} 
            icon={<Timer className="h-6 w-6 text-indigo-400" />} 
          />
          <StatCard 
            title="Staff Assigned" 
            value={`${selectedRestaurant.staff} active`} 
            icon={<Users className="h-6 w-6 text-blue-400" />} 
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Completed</span>
            <span className="text-xl font-black text-emerald-400">{selectedRestaurant.completed}</span>
          </div>
          <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Pending</span>
            <span className="text-xl font-black text-purple-400">{selectedRestaurant.pending}</span>
          </div>
          <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Completed Ratio</span>
            <span className="text-xl font-black text-teal-400">{selectedRestaurant.completed_percentage}%</span>
          </div>
          <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cancelled Ratio</span>
            <span className="text-xl font-black text-rose-400">{selectedRestaurant.cancelled_percentage}%</span>
          </div>
        </div>

        {/* Charts & Graphs specific to this restaurant */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-gray-200">Peak Order Demand by Hour</h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer>
                <BarChart data={stats?.charts?.hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="hour" stroke="#9ca3af" fontSize={9} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#121020', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="Orders" fill="#a78bfa" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-gray-200">Revenue & Operations Summary</h4>
            <div className="space-y-4 pt-2">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-gray-400">Owner Email:</span>
                <span className="text-xs font-semibold text-gray-200">{selectedRestaurant.vendor}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-gray-400">Current Status:</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${selectedRestaurant.status === 'OPEN' ? 'text-emerald-400' : 'text-rose-400'}`}>{selectedRestaurant.status}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-gray-400">Accepting Orders:</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${selectedRestaurant.accepting_orders ? 'text-emerald-400' : 'text-rose-400'}`}>{selectedRestaurant.accepting_orders ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* College Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121020]/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
        <PageHeader 
          title="Restaurant Analytics" 
          description="Detailed breakdown of restaurant sales and performance."
        />

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-gray-400">Last updated: {lastUpdated || '...'}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStats(rangePreset, startDate, endDate)}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loadingStats ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <select
            value={rangePreset}
            onChange={(e) => setRangePreset(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 outline-none"
          >
            <option value="today" className="bg-[#121020]">Today</option>
            <option value="yesterday" className="bg-[#121020]">Yesterday</option>
            <option value="7d" className="bg-[#121020]">Last 7 Days</option>
            <option value="30d" className="bg-[#121020]">Last 30 Days</option>
            <option value="90d" className="bg-[#121020]">Last 90 Days</option>
            <option value="this_month" className="bg-[#121020]">This Month</option>
            <option value="last_month" className="bg-[#121020]">Last Month</option>
            <option value="custom" className="bg-[#121020]">Custom Range</option>
          </select>

          {rangePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs text-gray-200 outline-none"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs text-gray-200 outline-none"
              />
            </div>
          )}

          {/* Export Report Actions */}
          <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              icon={<Download className="h-3.5 w-3.5" />}
            >
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              icon={<BarChart2 className="h-3.5 w-3.5" />}
            >
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('print')}
              icon={<Printer className="h-3.5 w-3.5" />}
            >
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Approved Vendors" 
          value={loadingStats ? '...' : summary.approved_vendors ?? 0} 
          icon={<Store className="h-6 w-6 text-emerald-400" />} 
        />
        <StatCard 
          title="Total Campus Stalls" 
          value={loadingStats ? '...' : summary.total_restaurants ?? 0} 
          icon={<Store className="h-6 w-6 text-indigo-400" />} 
        />
        <StatCard 
          title="Today's Orders" 
          value={loadingStats ? '...' : summary.today_orders ?? 0} 
          icon={<ChefHat className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Today's Revenue" 
          value={loadingStats ? '...' : `₹${summary.today_revenue?.toFixed(2) || '0.00'}`} 
          icon={<Store className="h-6 w-6 text-amber-400" />} 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 lg:col-span-2">
          <div>
            <h4 className="text-sm font-bold text-gray-200">Revenue Trend (30 Days)</h4>
            <p className="text-xs text-gray-400">Completed order aggregates</p>
          </div>
          <RevenueLineChart data={stats?.charts?.revenue} yKey="Revenue" />
        </Card>

        <Card className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-200">Vendor Revenue Share</h4>
            <p className="text-xs text-gray-400">Total earnings split by canteen</p>
          </div>
          <StatusPieChart data={stats?.charts?.vendor_share} />
        </Card>
      </div>

      {/* Campus Restaurant Analytics Table */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
        <div>
          <h2 className="text-lg font-black uppercase text-purple-400">Campus Restaurant Analytics</h2>
          <p className="text-xs text-gray-400">Real-time operational visibility and metrics breakdown per food stall.</p>
        </div>

        <DataTable
          headers={restaurantHeaders}
          data={filteredRestaurants}
          loading={loadingStats}
          emptyMessage="No matching restaurants found."
          searchVal={searchVal}
          onSearchChange={setSearchVal}
          searchPlaceholder="Search restaurant or vendor email..."
          renderRow={(r, idx) => (
            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-200">{r.restaurant}</td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-300">{r.vendor}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{r.today_orders}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400 font-bold">{r.completed_percentage}%</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-400 font-bold">{r.cancelled_percentage}%</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400 font-bold">₹{r.revenue?.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{r.staff}</td>
              <td className="px-6 py-4 whitespace-nowrap text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${r.accepting_orders ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {r.accepting_orders ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRestaurant(r)}
                  icon={<BarChart2 className="h-3.5 w-3.5" />}
                >
                  View Details
                </Button>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
};

export default CollegeAdminAnalytics;
