import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboard';
import collegeService from '../services/college';
import deactivationService from '../services/deactivation';
import chatService from '../services/chat';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import Button from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Building, Users, Store, ShieldAlert, Check, X, Calendar, MessageSquare, ShieldCheck, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  // Active College Admins States
  const [activeAdminsList, setActiveAdminsList] = useState([]);
  const [loadingAdminsList, setLoadingAdminsList] = useState(true);
  const [adminSearch, setAdminSearch] = useState('');

  // Modals
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [actionType, setActionType] = useState('approve'); // approve, reject, deactivate, restore

  const refreshIntervalRef = useRef(null);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await dashboardService.getSuperAdminStats();
      if (res) {
        setStats(res);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingAdmins = async () => {
    setLoadingTable(true);
    try {
      const res = await collegeService.getPendingCollegeAdmins(currentPage, searchVal);
      if (res.success && res.data) {
        setPendingAdmins(res.data.results);
        setTotalCount(res.data.count);
      }
    } catch (err) {
      toast.error('Failed to load pending college administrators.');
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchActiveAdminsList = async () => {
    setLoadingAdminsList(true);
    try {
      const res = await deactivationService.getCollegeAdminsList();
      if (res && res.success && res.data) {
        const approvedAdmins = res.data.filter(admin => admin.status === 'APPROVED');
        setActiveAdminsList(approvedAdmins);
      }
    } catch (err) {
      toast.error('Failed to load college admin list.');
    } finally {
      setLoadingAdminsList(false);
    }
  };

  // Setup auto-refresh every 60 seconds
  useEffect(() => {
    fetchStats();
    fetchActiveAdminsList();
    fetchPendingAdmins();

    refreshIntervalRef.current = setInterval(() => {
      fetchStats();
    }, 60000); // 60 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchPendingAdmins();
  }, [currentPage, searchVal]);

  const handleAction = (id, type) => {
    setSelectedAdminId(id);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleMessageAdmin = async (admin) => {
    try {
      toast.loading('Initiating chat...');
      const res = await chatService.createConversation(admin.user_id);
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
        await collegeService.approveCollegeAdmin(selectedAdminId);
        toast.success('College administrator approved successfully!');
      } else if (actionType === 'reject') {
        await collegeService.rejectCollegeAdmin(selectedAdminId);
        toast.success('College administrator application rejected.');
      } else if (actionType === 'deactivate') {
        await deactivationService.deactivateCollegeAdmin(selectedAdminId);
        toast.success('College administrator deactivated successfully!');
      } else if (actionType === 'restore') {
        await deactivationService.restoreCollegeAdmin(selectedAdminId);
        toast.success('College administrator account restored successfully!');
      }
      
      fetchPendingAdmins();
      fetchActiveAdminsList();
      fetchStats();
    } catch (err) {
      toast.error(`Action failed.`);
    } finally {
      setConfirmOpen(false);
      setSelectedAdminId(null);
    }
  };

  const pendingHeaders = [
    { label: 'Name/Admin' },
    { label: 'Email' },
    { label: 'Campus/College' },
    { label: 'Registered On' },
    { label: 'Actions', className: 'text-right' }
  ];

  const adminHeaders = [
    { label: 'Name/Admin' },
    { label: 'Email' },
    { label: 'Campus/College' },
    { label: 'Status' },
    { label: 'Actions', className: 'text-right' }
  ];

  const summary = stats?.summary || {};

  return (
    <div className="space-y-8">
      {/* Super Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121020]/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
        <PageHeader 
          title="Super Admin Control Panel" 
          description="Manage colleges, review stats, and audit global platform operations."
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchStats(); fetchActiveAdminsList(); fetchPendingAdmins(); }}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loadingStats ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Colleges" 
          value={loadingStats ? '...' : summary.total_colleges} 
          icon={<Building className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Total Vendors" 
          value={loadingStats ? '...' : summary.total_vendors} 
          icon={<Store className="h-6 w-6 text-indigo-400" />} 
        />
        <StatCard 
          title="Total Restaurants" 
          value={loadingStats ? '...' : summary.total_restaurants} 
          icon={<Store className="h-6 w-6 text-amber-400" />} 
        />
        <StatCard 
          title="Total Active Staff" 
          value={loadingStats ? '...' : summary.total_staff} 
          icon={<Users className="h-6 w-6 text-blue-400" />} 
        />
        <StatCard 
          title="Pending Admin Approvals" 
          value={loadingStats ? '...' : summary.pending_admins ?? 0} 
          icon={<ShieldAlert className={`h-6 w-6 text-rose-400 ${summary.pending_admins > 0 ? 'animate-pulse' : ''}`} />} 
        />
      </div>

      {/* Approvals and Active Admin Management block */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Building className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">College Administrators List</h2>
              <p className="text-xs text-gray-400">View active college admins, message them directly, or deactivate accounts.</p>
            </div>
          </div>

          <DataTable
            headers={adminHeaders}
            data={activeAdminsList.filter(admin => 
              (admin.admin_name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
              (admin.user_email || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
              (admin.college_name || '').toLowerCase().includes(adminSearch.toLowerCase())
            )}
            loading={loadingAdminsList}
            emptyMessage="No matching college admins found."
            searchVal={adminSearch}
            onSearchChange={setAdminSearch}
            searchPlaceholder="Search admin name, email or college..."
            renderRow={(admin) => (
              <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">{admin.admin_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{admin.user_email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{admin.college_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] ${admin.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {admin.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMessageAdmin(admin)}
                    icon={<MessageSquare className="h-3.5 w-3.5" />}
                  >
                    Message
                  </Button>
                  {admin.is_active ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleAction(admin.id, 'deactivate')}
                      icon={<X className="h-3.5 w-3.5" />}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAction(admin.id, 'restore')}
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

        {/* Pending College Admin Approvals */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <ShieldAlert className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Pending College Admin Approvals</h2>
              <p className="text-xs text-gray-400">Review registration requests for administrators linking to colleges.</p>
            </div>
          </div>

          <DataTable
            headers={pendingHeaders}
            data={pendingAdmins}
            loading={loadingTable}
            emptyMessage="No pending college administrator approval requests."
            searchVal={searchVal}
            onSearchChange={(val) => {
              setSearchVal(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="Search by admin name..."
            currentPage={currentPage}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
            renderRow={(admin) => (
              <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{admin.admin_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">{admin.user_email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{admin.college_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                    {new Date(admin.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleAction(admin.id, 'approve')}
                    icon={<Check className="h-3.5 w-3.5" />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleAction(admin.id, 'reject')}
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
          actionType === 'approve' ? 'Approve College Administrator' :
          actionType === 'reject' ? 'Reject College Administrator' :
          actionType === 'deactivate' ? 'Deactivate College Admin?' :
          'Restore College Admin?'
        }
        message={
          actionType === 'approve' ? 'Are you sure you want to approve this Administrator? This action cannot be undone.' :
          actionType === 'reject' ? 'Are you sure you want to reject this Administrator? This action cannot be undone.' :
          actionType === 'deactivate' ? "This will disable login credentials for the admin. They will no longer manage their campus." :
          "Are you sure you want to restore access for this college admin?"
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

export default SuperAdminDashboard;
