import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosClient from '../../config/axios';
import { Table } from '../../components/Table';
import { Loader } from '../../components/Loader';
import { StatusBadge } from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const VendorMenuDashboard = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Note: For full production, Vendor ID should be derived from user session context.
  const fetchMenu = async () => {
    try {
      // In a real flow, the backend filters this automatically via VendorOwnershipPermission logic mapped to the user.
      const response = await axiosClient.get('/menu-items/');
      setItems(response.data.results || response.data);
    } catch (err) {
      toast.error("Failed to load catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const columns = [
    { header: 'Item Name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
          {row.image && <img src={row.image} alt={row.name} className="w-full h-full object-cover" />}
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.category_name}</p>
        </div>
      </div>
    )},
    { header: 'Price', render: (row) => `₹${row.price}` },
    { header: 'Prep Time', render: (row) => `${row.preparation_time} mins` },
    { header: 'Status', render: (row) => <StatusBadge status={row.is_available} /> },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-3">
        <button className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
        <button className="text-red-600 hover:underline text-sm font-medium">Delete</button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Catalog Management</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your categories, food items, variants, and add-ons.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium transition">
            Manage Categories
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
            + Add New Item
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white">All Menu Items</h3>
        </div>
        <div className="p-6">
          {loading ? <Loader /> : <Table columns={columns} data={items} />}
        </div>
      </div>
    </div>
  );
};

export default VendorMenuDashboard;
