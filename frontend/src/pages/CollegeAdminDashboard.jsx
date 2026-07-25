import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { Store, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const CollegeAdminDashboard = () => {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingVendors = async () => {
    try {
      const data = await authService.getPendingVendors();
      setPendingVendors(data);
    } catch (err) {
      toast.error('Failed to load pending vendors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const handleApprove = async (id) => {
    try {
      await authService.approveVendor(id);
      toast.success('Vendor approved successfully!');
      fetchPendingVendors();
    } catch (err) {
      toast.error('Failed to approve vendor.');
    }
  };

  const handleReject = async (id) => {
    try {
      await authService.rejectVendor(id);
      toast.success('Vendor registration rejected.');
      fetchPendingVendors();
    } catch (err) {
      toast.error('Failed to reject vendor.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 to-purple-800/40 border border-white/5 relative overflow-hidden shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">College Admin Dashboard</h1>
        <p className="text-gray-300">Approve vendor stalls and manage food providers within your campus.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Store className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Pending Vendor Approvals</h2>
            <p className="text-xs text-gray-400">Review registration requests for new food stalls on your campus.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : pendingVendors.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
            No pending vendor approvals.
          </div>
        ) : (
          <div className="overflow-hidden border border-white/5 rounded-xl bg-white/[0.02]">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-[#12101b]">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">{vendor.shop_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{vendor.user_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      {vendor.shop_area} - {vendor.block}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleApprove(vendor.id)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(vendor.id)}
                        className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeAdminDashboard;
