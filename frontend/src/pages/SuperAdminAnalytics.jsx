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
  Building, Users, Store, ChefHat, RefreshCw, Download, Printer, BarChart2, ArrowLeft, Timer
} from 'lucide-react';
import { RevenueAreaChart } from '../components/common/DashboardCharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export const SuperAdminAnalytics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [canteenSearch, setCanteenSearch] = useState('');

  // Time filters
  const [rangePreset, setRangePreset] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // Multi-Level Drill Down States
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const refreshIntervalRef = useRef(null);

  const fetchStats = async (preset = rangePreset, start = startDate, end = endDate) => {
    setLoadingStats(true);
    try {
      const res = await dashboardService.getSuperAdminStats(preset, start, end);
      if (res) {
        setStats(res);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load platform analytics.');
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
      await dashboardService.downloadReport('platform', format, rangePreset, startDate, endDate);
      toast.dismiss();
      toast.success(`${format.toUpperCase()} report generated successfully!`);
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export report.');
    }
  };

  const collegesHeaders = [
    { label: 'College' },
    { label: 'Restaurants' },
    { label: 'Vendors' },
    { label: 'Staff Count' },
    { label: 'Orders (Range)' },
    { label: 'Revenue' },
    { label: 'Actions', className: 'text-right' }
  ];

  const summary = stats?.summary || {};
  const collegesTable = stats?.tables?.colleges || [];

  // LEVEL 3: Vendor Analytics Drill down subview
  if (selectedVendor) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121020]/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
              <span className="cursor-pointer hover:text-purple-400" onClick={() => { setSelectedCollege(null); setSelectedVendor(null); }}>Platform Analytics</span>
              <span>&gt;</span>
              <span className="cursor-pointer hover:text-purple-400" onClick={() => setSelectedVendor(null)}>{selectedCollege.college}</span>
              <span>&gt;</span>
              <span className="text-purple-400">{selectedVendor.restaurant}</span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-100 uppercase tracking-widest">{selectedVendor.restaurant} Performance</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedVendor(null)}
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
          >
            Back to College Overview
          </Button>
        </div>

        {/* Vendor stats metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Revenue" 
            value={`₹${selectedVendor.revenue?.toFixed(2)}`} 
            icon={<Store className="h-6 w-6 text-emerald-400" />} 
          />
          <StatCard 
            title="Total Orders (Range)" 
            value={selectedVendor.today_orders} 
            icon={<ChefHat className="h-6 w-6 text-purple-400" />} 
          />
          <StatCard 
            title="Average Order Value" 
            value={`₹${selectedVendor.average_order_value?.toFixed(2)}`} 
            icon={<Timer className="h-6 w-6 text-indigo-400" />} 
          />
          <StatCard 
            title="Staff Count" 
            value={`${selectedVendor.staff} active`} 
            icon={<Users className="h-6 w-6 text-blue-400" />} 
          />
        </div>

        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-purple-400">Stall Operations Summary</h3>
          <div className="space-y-4 pt-2">
            <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
              <span className="text-gray-400">Stall Owner:</span>
              <span className="font-semibold text-gray-200">{selectedVendor.vendor}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
              <span className="text-gray-400">Accepting Orders:</span>
              <span className={`font-bold uppercase ${selectedVendor.accepting_orders ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedVendor.accepting_orders ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
              <span className="text-gray-400">Shop Status:</span>
              <span className={`font-bold uppercase ${selectedVendor.status === 'OPEN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedVendor.status}
              </span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // LEVEL 2: College Overview Drill down subview
  if (selectedCollege) {
    const collegeCanteens = (stats?.tables?.restaurants || []).filter(r => r.college_id === selectedCollege.id);
    const filteredCanteens = collegeCanteens.filter(r =>
      (r.restaurant || '').toLowerCase().includes(canteenSearch.toLowerCase()) ||
      (r.vendor || '').toLowerCase().includes(canteenSearch.toLowerCase())
    );

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121020]/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
              <span className="cursor-pointer hover:text-purple-400" onClick={() => setSelectedCollege(null)}>Platform Analytics</span>
              <span>&gt;</span>
              <span className="text-purple-400">{selectedCollege.college}</span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-100 uppercase tracking-widest">{selectedCollege.college} Overview</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedCollege(null)}
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
          >
            Back to Platform Analytics
          </Button>
        </div>

        {/* College overview stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Restaurants" 
            value={selectedCollege.restaurants} 
            icon={<Store className="h-6 w-6 text-purple-400" />} 
          />
          <StatCard 
            title="Vendors" 
            value={selectedCollege.vendors} 
            icon={<Store className="h-6 w-6 text-indigo-400" />} 
          />
          <StatCard 
            title="Orders (Range)" 
            value={selectedCollege.orders} 
            icon={<ChefHat className="h-6 w-6 text-amber-400" />} 
          />
          <StatCard 
            title="Revenue (Range)" 
            value={`₹${selectedCollege.revenue?.toFixed(2)}`} 
            icon={<Store className="h-6 w-6 text-emerald-400" />} 
          />
          <StatCard 
            title="Staff Members" 
            value={`${selectedCollege.staff} staff`} 
            icon={<Users className="h-6 w-6 text-blue-400" />} 
          />
        </div>

        {/* Restaurants in College Datagrid */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
          <h3 className="text-sm font-black uppercase text-purple-400">Campus Stalls & Vendors</h3>
          <DataTable
            headers={[
              { label: 'Restaurant' },
              { label: 'Vendor' },
              { label: 'Revenue' },
              { label: 'Orders' },
              { label: 'Staff Count' },
              { label: 'Status' },
              { label: 'Actions', className: 'text-right' }
            ]}
            data={filteredCanteens}
            loading={loadingStats}
            emptyMessage="No matching restaurants found under this college."
            searchVal={canteenSearch}
            onSearchChange={setCanteenSearch}
            searchPlaceholder="Search restaurant or vendor..."
            renderRow={(r, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-200">{r.restaurant}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{r.vendor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400 font-bold">₹{r.revenue?.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{r.today_orders}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{r.staff}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${r.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVendor(r)}
                    icon={<BarChart2 className="h-3.5 w-3.5" />}
                  >
                    View Vendor
                  </Button>
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Super Admin Filter Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121020]/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
        <PageHeader 
          title="Platform Analytics" 
          description="Detailed breakdown of colleges canteens sales and platform metrics."
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
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          title="Colleges" 
          value={loadingStats ? '...' : summary.total_colleges} 
          icon={<Building className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Vendors" 
          value={loadingStats ? '...' : summary.total_vendors} 
          icon={<Store className="h-6 w-6 text-indigo-400" />} 
        />
        <StatCard 
          title="Restaurants" 
          value={loadingStats ? '...' : summary.total_restaurants} 
          icon={<Store className="h-6 w-6 text-amber-400" />} 
        />
        <StatCard 
          title="Staff Count" 
          value={loadingStats ? '...' : summary.total_staff} 
          icon={<Users className="h-6 w-6 text-blue-400" />} 
        />
        <StatCard 
          title="Today's Orders" 
          value={loadingStats ? '...' : summary.today_orders} 
          icon={<ChefHat className="h-6 w-6 text-indigo-400" />} 
        />
        <StatCard 
          title="Today's Revenue" 
          value={loadingStats ? '...' : `₹${summary.today_revenue?.toFixed(2) || '0.00'}`} 
          icon={<Store className="h-6 w-6 text-emerald-400" />} 
        />
      </div>

      {/* Monthly and Growth Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Monthly Orders</span>
          <span className="text-xl font-black text-purple-400">{summary.monthly_orders ?? 0}</span>
        </div>
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Monthly Revenue</span>
          <span className="text-xl font-black text-emerald-400">₹{summary.monthly_revenue?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Monthly Growth</span>
          <span className={`text-xl font-black ${summary.growth_percentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.growth_percentage >= 0 ? '+' : ''}{summary.growth_percentage}%
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Average Order Value</span>
          <span className="text-xl font-black text-indigo-400">₹{summary.average_order_value?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-200">Platform Revenue Trend (30 Days)</h4>
            <p className="text-xs text-gray-400">Completed order aggregates globally</p>
          </div>
          <RevenueAreaChart data={stats?.charts?.revenue} yKey="Revenue" />
        </Card>

        <Card className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-200">Colleges Comparison (Range)</h4>
            <p className="text-xs text-gray-400">Total revenue generated per college campus</p>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={stats?.charts?.college_comparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#121020', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Colleges Table */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
        <div>
          <h2 className="text-lg font-black uppercase text-purple-400">Colleges Performance Analytics</h2>
          <p className="text-xs text-gray-400">Real-time statistics breakdown and drill downs per registered campus.</p>
        </div>

        <DataTable
          headers={collegesHeaders}
          data={collegesTable.filter(col =>
            (col.college || '').toLowerCase().includes(collegeSearch.toLowerCase())
          )}
          loading={loadingStats}
          emptyMessage="No matching colleges found."
          searchVal={collegeSearch}
          onSearchChange={setCollegeSearch}
          searchPlaceholder="Search college name..."
          renderRow={(col, idx) => (
            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-200">{col.college}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{col.restaurants}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{col.vendors}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{col.staff}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{col.orders}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400 font-bold">₹{col.revenue?.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCollege(col)}
                  icon={<BarChart2 className="h-3.5 w-3.5" />}
                >
                  View College
                </Button>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;
