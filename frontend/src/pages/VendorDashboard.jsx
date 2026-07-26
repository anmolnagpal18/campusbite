import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboard';
import staffService from '../services/staff';
import deactivationService from '../services/deactivation';
import chatService from '../services/chat';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ChefHat, ShieldAlert, Check, X, Calendar, MessageSquare, ShieldCheck } from 'lucide-react';
import { RevenueChart, OrderVolumeChart } from '../components/common/DashboardCharts';
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

  // Active Staff States
  const [activeStaffList, setActiveStaffList] = useState([]);
  const [loadingStaffList, setLoadingStaffList] = useState(true);

  // Modals
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [actionType, setActionType] = useState('approve'); // approve, reject, deactivate, restore

  const fetchStats = async () => {
    try {
      const res = await dashboardService.getVendorStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
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
        // Filter out any status that is PENDING (only show APPROVED/REJECTED staff here)
        const approvedStaff = res.data.filter(s => s.status === 'APPROVED');
        setActiveStaffList(approvedStaff);
      }
    } catch (err) {
      toast.error('Failed to load staff list.');
    } finally {
      setLoadingStaffList(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchActiveStaffList();
  }, []);

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

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Vendor Control Panel" 
        description="Monitor staff, track orders, and view stall statistics."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          title="Today's Orders" 
          value={loadingStats ? '...' : stats?.today_orders || 0} 
          icon={<ChefHat className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Today's Revenue" 
          value={loadingStats ? '...' : `$${stats?.today_revenue?.toFixed(2)}`} 
          icon={<ChefHat className="h-6 w-6 text-emerald-400" />} 
        />
        <StatCard 
          title="Total Categories" 
          value={loadingStats ? '...' : stats?.total_categories} 
          icon={<ChefHat className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Total Food Items" 
          value={loadingStats ? '...' : stats?.total_items} 
          icon={<ChefHat className="h-6 w-6 text-blue-400" />} 
        />
        <StatCard 
          title="Available Items" 
          value={loadingStats ? '...' : stats?.available_items} 
          icon={<ChefHat className="h-6 w-6 text-emerald-400" />} 
        />
        <StatCard 
          title="Staff Pending" 
          value={loadingStats ? '...' : stats?.pending_staff} 
          icon={<ShieldAlert className={`h-6 w-6 text-rose-400 ${stats?.pending_staff > 0 ? 'animate-pulse' : ''}`} />} 
        />
      </div>

      {/* Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart revenue={stats?.today_revenue || 0} />
        <OrderVolumeChart 
          preparing={0} 
          ready={0} 
        />
      </div>

      {/* Advanced Analytics Card */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-100">Advanced Menu & Order Analytics</h2>
          <p className="text-xs text-gray-400">Deep-dive stats relating to food categories, items stock, and sales metrics.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Category with Most Items</span>
            <span className="text-lg font-extrabold text-gray-200">{loadingStats ? '...' : stats?.category_most_items || 'None'}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Low Stock Items</span>
            <span className="text-lg font-extrabold text-gray-200">{loadingStats ? '...' : stats?.low_stock_items_count} items</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Total Active Menu Items</span>
            <span className="text-lg font-extrabold text-gray-200">{loadingStats ? '...' : stats?.total_active_menu_items} active</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Best Selling Category</span>
            <span className="text-xs text-gray-500 font-semibold">{loadingStats ? '...' : stats?.best_selling_category}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Average Order Value</span>
            <span className="text-xs text-gray-500 font-semibold">{loadingStats ? '...' : stats?.avg_order_value}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Most Ordered Item</span>
            <span className="text-xs text-gray-500 font-semibold">{loadingStats ? '...' : stats?.most_ordered_item}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Least Ordered Item</span>
            <span className="text-xs text-gray-500 font-semibold">{loadingStats ? '...' : stats?.least_ordered_item}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Stall Staff Management Card */}
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
            data={activeStaffList}
            loading={loadingStaffList}
            emptyMessage="No staff members registered yet."
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
