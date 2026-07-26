import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboard';
import vendorService from '../services/vendor';
import deactivationService from '../services/deactivation';
import chatService from '../services/chat';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Store, ShieldAlert, Check, X, Calendar, MessageSquare, ShieldCheck } from 'lucide-react';
import { RevenueChart, OrderVolumeChart } from '../components/common/DashboardCharts';
import toast from 'react-hot-toast';

export const CollegeAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  // Active Vendors States
  const [activeVendorsList, setActiveVendorsList] = useState([]);
  const [loadingVendorsList, setLoadingVendorsList] = useState(true);

  // Modals
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [actionType, setActionType] = useState('approve'); // approve, reject, deactivate, restore

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

  const fetchActiveVendorsList = async () => {
    setLoadingVendorsList(true);
    try {
      const res = await deactivationService.getVendorsList();
      if (res && res.success && res.data) {
        // Filter out any status that is PENDING (only show APPROVED/REJECTED vendors here)
        const approvedVendors = res.data.filter(v => v.status === 'APPROVED');
        setActiveVendorsList(approvedVendors);
      }
    } catch (err) {
      toast.error('Failed to load vendors list.');
    } finally {
      setLoadingVendorsList(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchActiveVendorsList();
  }, []);

  useEffect(() => {
    fetchPendingVendors();
  }, [currentPage, searchVal]);

  const handleAction = (id, type) => {
    setSelectedVendorId(id);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleMessageVendor = async (vendor) => {
    try {
      toast.loading('Initiating chat...');
      const res = await chatService.createConversation(vendor.user_id);
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
        await vendorService.approveVendor(selectedVendorId);
        toast.success('Vendor approved successfully!');
      } else if (actionType === 'reject') {
        await vendorService.rejectVendor(selectedVendorId);
        toast.success('Vendor application rejected.');
      } else if (actionType === 'deactivate') {
        await deactivationService.deactivateVendor(selectedVendorId);
        toast.success('Vendor account deactivated successfully!');
      } else if (actionType === 'restore') {
        await deactivationService.restoreVendor(selectedVendorId);
        toast.success('Vendor account restored successfully!');
      }
      
      fetchPendingVendors();
      fetchActiveVendorsList();
      fetchStats();
    } catch (err) {
      toast.error(`Action failed.`);
    } finally {
      setConfirmOpen(false);
      setSelectedVendorId(null);
    }
  };

  const pendingHeaders = [
    { label: 'Shop Name' },
    { label: 'Owner Email' },
    { label: 'Location' },
    { label: 'Registered On' },
    { label: 'Actions', className: 'text-right' }
  ];

  const vendorHeaders = [
    { label: 'Shop Name' },
    { label: 'Owner Email' },
    { label: 'Location' },
    { label: 'Status' },
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

      <div className="grid grid-cols-1 gap-6">
        {/* Stall Vendor Management Card */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Store className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Campus Stalls & Vendors</h2>
              <p className="text-xs text-gray-400">View active vendors, message them directly, or deactivate accounts.</p>
            </div>
          </div>

          <DataTable
            headers={vendorHeaders}
            data={activeVendorsList}
            loading={loadingVendorsList}
            emptyMessage="No vendors registered on this campus yet."
            renderRow={(vendor) => (
              <tr key={vendor.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">{vendor.shop_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{vendor.user_email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                  {vendor.shop_area} - {vendor.block}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] ${vendor.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {vendor.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMessageVendor(vendor)}
                    icon={<MessageSquare className="h-3.5 w-3.5" />}
                  >
                    Message
                  </Button>
                  {vendor.is_active ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleAction(vendor.id, 'deactivate')}
                      icon={<X className="h-3.5 w-3.5" />}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAction(vendor.id, 'restore')}
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

        {/* Pending Vendor Approvals Card */}
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
            headers={pendingHeaders}
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
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        type={['reject', 'deactivate'].includes(actionType) ? 'danger' : 'primary'}
        title={
          actionType === 'approve' ? 'Approve Vendor' :
          actionType === 'reject' ? 'Reject Vendor' :
          actionType === 'deactivate' ? 'Deactivate Vendor?' :
          'Restore Vendor?'
        }
        message={
          actionType === 'approve' ? 'Are you sure you want to approve this Vendor? This action cannot be undone.' :
          actionType === 'reject' ? 'Are you sure you want to reject this Vendor? This action cannot be undone.' :
          actionType === 'deactivate' ? "Deactivate Vendor? This will disable the vendor's login. Restaurant will no longer accept orders and staff accounts will also be disabled." :
          "Are you sure you want to restore access for this vendor? Linked staff members will also be re-enabled."
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

export default CollegeAdminDashboard;
