import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosClient from '../../config/axios';
import { Table } from '../../components/Table';
import { StatusBadge } from '../../components/StatusBadge';
import { SearchBox } from '../../components/SearchBox';
import { Pagination } from '../../components/Pagination';
import { Loader } from '../../components/Loader';
import { EmptyState } from '../../components/EmptyState';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_universities: 0, active_vendors: 0 });
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      // Mock stats for Phase 2 since no dedicated stat API exists yet
      setStats({ total_universities: 12, active_vendors: 450 });
      
      const response = await axiosClient.get(`/universities/?search=${search}&page=${page}`);
      setUniversities(response.data.results || response.data); // Support pagination or raw array
      setTotalPages(Math.ceil((response.data.count || response.data.length || 0) / 10));
    } catch (err) {
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, [search, page]);

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Code', accessor: 'code' },
    { header: 'Location', render: (row) => `${row.city || 'N/A'}, ${row.state || 'N/A'}` },
    { header: 'Status', render: (row) => <StatusBadge status={row.is_active} /> }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Universities</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.total_universities}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Active Vendors</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.active_vendors}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Universities</h2>
          <div className="flex items-center gap-4">
            <SearchBox onSearch={setSearch} placeholder="Search universities..." />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
              + New University
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <Loader />
          ) : universities.length === 0 ? (
            <EmptyState title="No universities found" message="Get started by creating a new university." />
          ) : (
            <>
              <Table columns={columns} data={universities} />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
