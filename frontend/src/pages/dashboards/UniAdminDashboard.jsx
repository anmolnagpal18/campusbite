import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosClient from '../../config/axios';
import { Table } from '../../components/Table';
import { StatusBadge } from '../../components/StatusBadge';
import { SearchBox } from '../../components/SearchBox';
import { Pagination } from '../../components/Pagination';
import { Loader } from '../../components/Loader';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import toast from 'react-hot-toast';

const UniAdminDashboard = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'suspend'

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(`/vendors/?search=${search}&page=${page}`);
      setVendors(response.data.results || response.data);
      setTotalPages(Math.ceil((response.data.count || response.data.length || 0) / 10));
    } catch (err) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, page]);

  const handleAction = async () => {
    if (!selectedVendor) return;
    try {
      await axiosClient.post(`/vendors/${selectedVendor.id}/${actionType}/`, {
        approval_notes: `Action taken by ${user.first_name}`
      });
      toast.success(`Vendor ${actionType}d successfully`);
      setDialogOpen(false);
      fetchVendors();
    } catch (err) {
      toast.error(`Failed to ${actionType} vendor`);
    }
  };

  const openDialog = (vendor, action) => {
    setSelectedVendor(vendor);
    setActionType(action);
    setDialogOpen(true);
  };

  const columns = [
    { header: 'Store Name', accessor: 'vendor_name' },
    { header: 'Owner', accessor: 'owner_name' },
    { header: 'Block', render: (row) => row.block_details?.name || 'N/A' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Actions', 
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'PENDING' && (
            <>
              <button onClick={() => openDialog(row, 'approve')} className="text-green-600 hover:underline text-sm font-medium">Approve</button>
              <button onClick={() => openDialog(row, 'reject')} className="text-red-600 hover:underline text-sm font-medium">Reject</button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <button onClick={() => openDialog(row, 'suspend')} className="text-orange-600 hover:underline text-sm font-medium">Suspend</button>
          )}
        </div>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Vendor Management</h2>
        <p className="text-slate-500 dark:text-slate-400">Review and manage vendor applications across your university blocks.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vendors Directory</h3>
          <SearchBox onSearch={setSearch} placeholder="Search vendors by name or email..." />
        </div>
        
        <div className="p-6">
          {loading ? (
            <Loader />
          ) : (
            <>
              <Table columns={columns} data={vendors} />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      <ConfirmationDialog 
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleAction}
        title={`Confirm ${actionType}`}
        message={`Are you sure you want to ${actionType} the vendor '${selectedVendor?.vendor_name}'?`}
        confirmText={actionType.charAt(0).toUpperCase() + actionType.slice(1)}
        isDestructive={actionType === 'reject' || actionType === 'suspend'}
      />
    </div>
  );
};

export default UniAdminDashboard;
