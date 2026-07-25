import React, { useState, useEffect } from 'react';
import dashboardService from '../services/dashboard';
import collegeService from '../services/college';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Building, Users, Store, ShieldAlert, Check, X, Calendar } from 'lucide-react';
import { RevenueChart, OrderVolumeChart } from '../components/common/DashboardCharts';
import toast from 'react-hot-toast';

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [actionType, setActionType] = useState('approve');

  const fetchStats = async () => {
    try {
      const res = await dashboardService.getSuperAdminStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPendingAdmins();
  }, [currentPage, searchVal]);

  const handleAction = (id, type) => {
    setSelectedAdminId(id);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === 'approve') {
        await collegeService.approveCollegeAdmin(selectedAdminId);
        toast.success('College Admin approved successfully!');
      } else {
        await collegeService.rejectCollegeAdmin(selectedAdminId);
        toast.success('College Admin rejected.');
      }
      fetchPendingAdmins();
      fetchStats();
    } catch (err) {
      toast.error(`Action failed.`);
    }
  };

  const headers = [
    { label: 'Email' },
    { label: 'College Representing' },
    { label: 'Registered On' },
    { label: 'Actions', className: 'text-right' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Super Admin Control Panel" 
        description="Monitor system statistics and approve incoming College Administrators."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Colleges" 
          value={loadingStats ? '...' : stats?.total_colleges} 
          icon={<Building className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Total Vendors" 
          value={loadingStats ? '...' : stats?.total_vendors} 
          icon={<Store className="h-6 w-6 text-emerald-400" />} 
        />
        <StatCard 
          title="Total Staff" 
          value={loadingStats ? '...' : stats?.total_staff} 
          icon={<Users className="h-6 w-6 text-amber-400" />} 
        />
        <StatCard 
          title="Total Users" 
          value={loadingStats ? '...' : stats?.total_users} 
          icon={<Users className="h-6 w-6 text-indigo-400" />} 
        />
        <StatCard 
          title="Pending Admins" 
          value={loadingStats ? '...' : stats?.pending_college_admins} 
          icon={<ShieldAlert className="h-6 w-6 text-red-400 animate-pulse" />} 
        />
      </div>

      {/* Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart revenue={0} />
        <OrderVolumeChart preparing={0} ready={0} />
      </div>

      <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <Building className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Pending College Admin Approvals</h2>
            <p className="text-xs text-gray-400">Review registration requests for College Administrators representing campuses.</p>
          </div>
        </div>

        <DataTable
          headers={headers}
          data={pendingAdmins}
          loading={loadingTable}
          emptyMessage="No pending college admin requests."
          searchVal={searchVal}
          onSearchChange={(val) => {
            setSearchVal(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by email or college..."
          currentPage={currentPage}
          totalCount={totalCount}
          onPageChange={setCurrentPage}
          renderRow={(admin) => (
            <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{admin.user_email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">{admin.college_name}</td>
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        type={actionType === 'reject' ? 'danger' : 'primary'}
        title={actionType === 'approve' ? 'Approve Administrator' : 'Reject Administrator'}
        message={`Are you sure you want to ${actionType} this College Admin? This action cannot be undone.`}
        confirmText={actionType === 'approve' ? 'Approve' : 'Reject'}
      />
    </div>
  );
};

export default SuperAdminDashboard;
