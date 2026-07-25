import React, { useState, useEffect } from 'react';
import dashboardService from '../services/dashboard';
import vendorService from '../services/vendor';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Store, ShieldAlert, Check, X, Calendar } from 'lucide-react';
import { RevenueChart, OrderVolumeChart } from '../components/common/DashboardCharts';
import toast from 'react-hot-toast';

export const CollegeAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [actionType, setActionType] = useState('approve');

  const fetchStats = async () => {
    try {
      const res = await dashboardService.getCollegeAdminStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingVendors = async () => {
    setLoadingTable(true);
    try {
      const res = await vendorService.getPendingVendors(currentPage, searchVal);
      if (res.success && res.data) {
        setPendingVendors(res.data.results);
        setTotalCount(res.data.count);
      }
    } catch (err) {
      toast.error('Failed to load pending vendors.');
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPendingVendors();
  }, [currentPage, searchVal]);

  const handleAction = (id, type) => {
    setSelectedVendorId(id);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === 'approve') {
        await vendorService.approveVendor(selectedVendorId);
        toast.success('Vendor approved successfully!');
      } else {
        await vendorService.rejectVendor(selectedVendorId);
        toast.success('Vendor rejected.');
      }
      fetchPendingVendors();
      fetchStats();
    } catch (err) {
      toast.error(`Action failed.`);
    }
  };

  const headers = [
    { label: 'Shop Name' },
    { label: 'Owner Email' },
    { label: 'Location' },
    { label: 'Registered On' },
    { label: 'Actions', className: 'text-right' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="College Admin Control Panel" 
        description="Monitor campus stalls, approve vendor applications and manage layouts."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Vendors Pending" 
          value={loadingStats ? '...' : stats?.vendors_pending} 
          icon={<ShieldAlert className="h-6 w-6 text-amber-400 animate-pulse" />} 
        />
        <StatCard 
          title="Vendors Approved" 
          value={loadingStats ? '...' : stats?.vendors_approved} 
          icon={<Store className="h-6 w-6 text-emerald-400" />} 
        />
        <StatCard 
          title="Total Campus Restaurants" 
          value={loadingStats ? '...' : stats?.total_restaurants} 
          icon={<Store className="h-6 w-6 text-indigo-400" />} 
        />
      </div>

      {/* Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart revenue={0} />
        <OrderVolumeChart preparing={0} ready={0} />
      </div>

      <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Store className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Pending Vendor Approvals</h2>
            <p className="text-xs text-gray-400">Review register requests for new food stalls on your campus.</p>
          </div>
        </div>

        <DataTable
          headers={headers}
          data={pendingVendors}
          loading={loadingTable}
          emptyMessage="No pending vendor approvals."
          searchVal={searchVal}
          onSearchChange={(val) => {
            setSearchVal(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by shop or owner email..."
          currentPage={currentPage}
          totalCount={totalCount}
          onPageChange={setCurrentPage}
          renderRow={(vendor) => (
            <tr key={vendor.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">{vendor.shop_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{vendor.user_email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                {vendor.shop_area} - {vendor.block}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  {new Date(vendor.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleAction(vendor.id, 'approve')}
                  icon={<Check className="h-3.5 w-3.5" />}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleAction(vendor.id, 'reject')}
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
        title={actionType === 'approve' ? 'Approve Vendor' : 'Reject Vendor'}
        message={`Are you sure you want to ${actionType} this Vendor? This action cannot be undone.`}
        confirmText={actionType === 'approve' ? 'Approve' : 'Reject'}
      />
    </div>
  );
};

export default CollegeAdminDashboard;
