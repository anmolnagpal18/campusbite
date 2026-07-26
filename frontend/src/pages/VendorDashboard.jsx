import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboard';
import staffService from '../services/staff';
import deactivationService from '../services/deactivation';
import chatService from '../services/chat';
import orderingService from '../services/ordering';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  ChefHat, ShieldAlert, Check, X, Calendar, MessageSquare, ShieldCheck,
  TrendingUp, Download, Printer, RefreshCw, BarChart2, ShieldAlert as WarningIcon
} from 'lucide-react';
import { RevenueAreaChart, StatusPieChart, FoodsBarChart } from '../components/common/DashboardCharts';
import toast from 'react-hot-toast';

export const VendorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  // Time filters
  const [rangePreset, setRangePreset] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // Active Staff States
  const [activeStaffList, setActiveStaffList] = useState([]);
  const [loadingStaffList, setLoadingStaffList] = useState(true);
  const [staffSearch, setStaffSearch] = useState('');

  // Modals
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [actionType, setActionType] = useState('approve'); // approve, reject, deactivate, restore

  const refreshIntervalRef = useRef(null);

  const fetchStats = async (preset = rangePreset, start = startDate, end = endDate) => {
    setLoadingStats(true);
    try {
      const res = await dashboardService.getVendorStats(preset, start, end);
      if (res) {
        setStats(res);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingStaff = async () => {
    setLoadingTable(true);
    try {
      const res = await staffService.getPendingStaff(currentPage, searchVal);
      if (res.success && res.data) {
        setPendingStaff(res.data.results);
        setTotalCount(res.data.count);
      }
    } catch (err) {
      toast.error('Failed to load pending staff applications.');
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchActiveStaffList = async () => {
    setLoadingStaffList(true);
    try {
      const res = await deactivationService.getStaffList();
      if (res && res.success && res.data) {
        const approvedStaff = res.data.filter(s => s.status === 'APPROVED');
        setActiveStaffList(approvedStaff);
      }
    } catch (err) {
      toast.error('Failed to load staff list.');
    } finally {
      setLoadingStaffList(false);
    }
  };

  // Setup auto-refresh every 30 seconds
  useEffect(() => {
    fetchStats(rangePreset, startDate, endDate);
    fetchActiveStaffList();
    fetchPendingStaff();

    refreshIntervalRef.current = setInterval(() => {
      fetchStats(rangePreset, startDate, endDate);
    }, 30000); // 30 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [rangePreset, startDate, endDate]);

  useEffect(() => {
    fetchPendingStaff();
  }, [currentPage, searchVal]);

  const handleAction = (id, type) => {
    setSelectedStaffId(id);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleMessageStaff = async (staffUser) => {
    try {
      toast.loading('Initiating chat...');
      const res = await chatService.createConversation(staffUser.user_id);
      toast.dismiss();
      if (res && res.success && res.data && res.data.id) {
        navigate(`${ROUTES.MESSAGES}?conversationId=${res.data.id}`);
      }
    } catch (err) {
      toast.dismiss();
      const errMsg = err.response?.data?.detail || 'Failed to initiate conversation.';
      toast.error(errMsg);
    }
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === 'approve') {
        await staffService.approveStaff(selectedStaffId);
        toast.success('Staff member approved successfully!');
      } else if (actionType === 'reject') {
        await staffService.rejectStaff(selectedStaffId);
        toast.success('Staff application rejected.');
      } else if (actionType === 'deactivate') {
        await deactivationService.deactivateStaff(selectedStaffId);
        toast.success('Staff member deactivated successfully!');
      } else if (actionType === 'restore') {
        await deactivationService.restoreStaff(selectedStaffId);
        toast.success('Staff member account restored!');
      }
      
      fetchPendingStaff();
      fetchActiveStaffList();
      fetchStats();
    } catch (err) {
      toast.error(`Action failed.`);
    } finally {
      setConfirmOpen(false);
      setSelectedStaffId(null);
    }
  };

  const handleExport = async (format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} report...`);
      await dashboardService.downloadReport('vendor', format, rangePreset, startDate, endDate);
      toast.dismiss();
      toast.success(`${format.toUpperCase()} report generated successfully!`);
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export report.');
    }
  };

  const pendingHeaders = [
    { label: 'Email' },
    { label: 'Stall Linking' },
    { label: 'Registered On' },
    { label: 'Actions', className: 'text-right' }
  ];

  const staffHeaders = [
    { label: 'Email' },
    { label: 'Stall Linking' },
    { label: 'Account Status' },
    { label: 'Actions', className: 'text-right' }
  ];

  const summary = stats?.summary || {};

  return (
    <div className="space-y-8">
      {/* Dashboard Filter Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121020]/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
        <PageHeader 
          title="Vendor Control Panel" 
          description="Monitor staff, track orders, and view stall statistics."
        />
        
        {/* Controls block */}
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
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-purple-500 transition-colors"
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Orders" 
          value={loadingStats ? '...' : summary.today_orders ?? 0} 
          icon={<ChefHat className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Today's Revenue" 
          value={loadingStats ? '...' : `₹${summary.today_revenue?.toFixed(2) || '0.00'}`} 
          icon={<ChefHat className="h-6 w-6 text-emerald-400" />} 
        />
        <StatCard 
          title="Average Order Value" 
          value={loadingStats ? '...' : `₹${summary.average_order_value?.toFixed(2) || '0.00'}`} 
          icon={<ChefHat className="h-6 w-6 text-indigo-400" />} 
        />
        <StatCard 
          title="Average Prep Time" 
          value={loadingStats ? '...' : `${summary.average_preparation_time || 0} mins`} 
          icon={<ChefHat className="h-6 w-6 text-amber-400" />} 
        />
      </div>

      {/* Order Status KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Pending</span>
          <span className="text-xl font-black text-purple-400">{summary.pending_orders ?? 0}</span>
        </div>
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Preparing</span>
          <span className="text-xl font-black text-amber-400">{summary.preparing_orders ?? 0}</span>
        </div>
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Ready</span>
          <span className="text-xl font-black text-indigo-400">{summary.ready_orders ?? 0}</span>
        </div>
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Completed</span>
          <span className="text-xl font-black text-emerald-400">{summary.completed_orders ?? 0}</span>
        </div>
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cancelled</span>
          <span className="text-xl font-black text-rose-400">{summary.cancelled_orders ?? 0}</span>
        </div>
        <div className="p-4 rounded-3xl bg-[#121020]/60 border border-white/5 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Staff Pending</span>
          <span className="text-xl font-black text-blue-400">{summary.pending_staff ?? 0}</span>
        </div>
      </div>

      {/* Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-200">Revenue Trend (Range)</h4>
            <p className="text-xs text-gray-400">Total revenue generated by date</p>
          </div>
          <RevenueAreaChart data={stats?.charts?.revenue} yKey="Revenue" />
        </Card>

        <Card className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-200">Orders Status Distribution</h4>
            <p className="text-xs text-gray-400">Total orders split by workflow status</p>
          </div>
          <StatusPieChart data={stats?.charts?.orders_status} />
        </Card>
      </div>

      {/* Advanced Canteen Analytics Block */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-100 font-extrabold uppercase tracking-wider text-purple-400">Advanced Kitchen & Menu Analytics</h2>
          <p className="text-xs text-gray-400">Deep-dive stats relating to food categories, preparation milestones, and item sales.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Top Selling Category</span>
            <span className="text-sm font-extrabold text-gray-200">{summary.top_selling_category || 'None'}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Peak Demand Hour</span>
            <span className="text-sm font-extrabold text-gray-200">{summary.peak_order_hour || 'N/A'}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Fastest Prep Time</span>
            <span className="text-sm font-extrabold text-gray-200">{summary.fastest_prep_time || 0} mins</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Slowest Prep Time</span>
            <span className="text-sm font-extrabold text-gray-200">{summary.slowest_prep_time || 0} mins</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Repeat Customers</span>
            <span className="text-sm font-extrabold text-gray-200">{summary.repeat_customers || 0} repeaters</span>
          </div>
        </div>
      </div>

      {/* Top Selling Foods Bar Chart */}
      <Card className="p-6 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-gray-200">Top Selling Foods (Range)</h4>
          <p className="text-xs text-gray-400">Total orders count per menu item</p>
        </div>
        <FoodsBarChart data={stats?.charts?.top_selling} />
      </Card>

      {/* Tables block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items Table */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
          <h3 className="text-sm font-black uppercase text-purple-400">Top 5 Selling Items</h3>
          <DataTable
            headers={[{ label: 'Food' }, { label: 'Orders' }, { label: 'Quantity' }, { label: 'Revenue' }]}
            data={stats?.tables?.top_selling_items?.slice(0, 5) || []}
            loading={loadingStats}
            emptyMessage="No orders placed in this period."
            renderRow={(item, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.food_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.orders}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-extrabold">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400 font-bold">₹{item.revenue?.toFixed(2)}</td>
              </tr>
            )}
          />
        </div>

        {/* Low Stock Items Table */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
          <h3 className="text-sm font-black uppercase text-rose-400 flex items-center gap-1">
            <WarningIcon className="h-4 w-4" />
            Inventory Low Stock Warnings
          </h3>
          <DataTable
            headers={[{ label: 'Food Item' }, { label: 'Stock Qty' }, { label: 'Availability' }]}
            data={stats?.tables?.low_stock_items || []}
            loading={loadingStats}
            emptyMessage="All items are sufficiently stocked."
            renderRow={(item, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.item_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-400 font-extrabold">{item.quantity} units</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${item.availability === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {item.availability}
                  </span>
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* Stall Staff Management Card */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <ChefHat className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Stall Staff Management</h2>
              <p className="text-xs text-gray-400">View active staff members, message them directly, or deactivate accounts.</p>
            </div>
          </div>

          <DataTable
            headers={staffHeaders}
            data={activeStaffList.filter(staff =>
              (staff.user_email || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
              (staff.vendor_shop || '').toLowerCase().includes(staffSearch.toLowerCase())
            )}
            loading={loadingStaffList}
            emptyMessage="No matching staff members found."
            searchVal={staffSearch}
            onSearchChange={setStaffSearch}
            searchPlaceholder="Search staff by email or shop..."
            renderRow={(staff) => (
              <tr key={staff.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{staff.user_email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">{staff.vendor_shop}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] ${staff.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {staff.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMessageStaff(staff)}
                    icon={<MessageSquare className="h-3.5 w-3.5" />}
                  >
                    Message
                  </Button>
                  {staff.is_active ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleAction(staff.id, 'deactivate')}
                      icon={<X className="h-3.5 w-3.5" />}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAction(staff.id, 'restore')}
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    >
                      Restore
                    </Button>
                  )}
                </td>
              </tr>
            )}
          />
        </div>

        {/* Pending Staff Approvals Card */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <ShieldAlert className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Pending Staff Approvals</h2>
              <p className="text-xs text-gray-400">Review registration requests for staff members linking to your shop.</p>
            </div>
          </div>

          <DataTable
            headers={pendingHeaders}
            data={pendingStaff}
            loading={loadingTable}
            emptyMessage="No pending staff approval requests."
            searchVal={searchVal}
            onSearchChange={(val) => {
              setSearchVal(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="Search by email..."
            currentPage={currentPage}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
            renderRow={(staff) => (
              <tr key={staff.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{staff.user_email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">{staff.vendor_shop}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                    {new Date(staff.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleAction(staff.id, 'approve')}
                    icon={<Check className="h-3.5 w-3.5" />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleAction(staff.id, 'reject')}
                    icon={<X className="h-3.5 w-3.5" />}
                  >
                    Reject
                  </Button>
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        type={['reject', 'deactivate'].includes(actionType) ? 'danger' : 'primary'}
        title={
          actionType === 'approve' ? 'Approve Staff Member' :
          actionType === 'reject' ? 'Reject Staff Member' :
          actionType === 'deactivate' ? 'Deactivate Staff?' :
          'Restore Staff?'
        }
        message={
          actionType === 'approve' ? 'Are you sure you want to approve this Staff Member? This action cannot be undone.' :
          actionType === 'reject' ? 'Are you sure you want to reject this Staff Member? This action cannot be undone.' :
          actionType === 'deactivate' ? "This will disable the staff's login credentials. They will no longer be able to access the staff dashboard." :
          "Are you sure you want to restore access for this staff member?"
        }
        confirmText={
          actionType === 'approve' ? 'Approve' :
          actionType === 'reject' ? 'Reject' :
          actionType === 'deactivate' ? 'Deactivate' :
          'Restore'
        }
      />
    </div>
  );
};

export default VendorDashboard;
