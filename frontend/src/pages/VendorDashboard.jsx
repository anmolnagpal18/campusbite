import React, { useState, useEffect } from 'react';
import dashboardService from '../services/dashboard';
import staffService from '../services/staff';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ChefHat, ShieldAlert, Check, X, Calendar } from 'lucide-react';
import { RevenueChart, OrderVolumeChart } from '../components/common/DashboardCharts';
import toast from 'react-hot-toast';

export const VendorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [actionType, setActionType] = useState('approve');

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

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPendingStaff();
  }, [currentPage, searchVal]);

  const handleAction = (id, type) => {
    setSelectedStaffId(id);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === 'approve') {
        await staffService.approveStaff(selectedStaffId);
        toast.success('Staff member approved successfully!');
      } else {
        await staffService.rejectStaff(selectedStaffId);
        toast.success('Staff member rejected.');
      }
      fetchPendingStaff();
      fetchStats();
    } catch (err) {
      toast.error(`Action failed.`);
    }
  };

  const headers = [
    { label: 'Email' },
    { label: 'Stall Linking' },
    { label: 'Registered On' },
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
          value={loadingStats ? '...' : stats?.today_orders} 
          icon={<ChefHat className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Today's Revenue" 
          value={loadingStats ? '...' : `$${parseFloat(stats?.today_revenue || 0).toFixed(2)}`} 
          icon={<ChefHat className="h-6 w-6 text-emerald-500" />} 
        />
        <StatCard 
          title="Categories" 
          value={loadingStats ? '...' : stats?.total_categories} 
          icon={<ChefHat className="h-6 w-6 text-indigo-400" />} 
        />
        <StatCard 
          title="Food Items" 
          value={loadingStats ? '...' : stats?.total_items} 
          icon={<ChefHat className="h-6 w-6 text-amber-400" />} 
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

      <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <ChefHat className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Pending Staff Approvals</h2>
            <p className="text-xs text-gray-400">Review registration requests for staff members linking to your shop.</p>
          </div>
        </div>

        <DataTable
          headers={headers}
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        type={actionType === 'reject' ? 'danger' : 'primary'}
        title={actionType === 'approve' ? 'Approve Staff Member' : 'Reject Staff Member'}
        message={`Are you sure you want to ${actionType} this Staff Member? This action cannot be undone.`}
        confirmText={actionType === 'approve' ? 'Approve' : 'Reject'}
      />
    </div>
  );
};

export default VendorDashboard;
