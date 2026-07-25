import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { Building, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const SuperAdminDashboard = () => {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingAdmins = async () => {
    try {
      const data = await authService.getPendingCollegeAdmins();
      setPendingAdmins(data);
    } catch (err) {
      toast.error('Failed to load pending college administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAdmins();
  }, []);

  const handleApprove = async (id) => {
    try {
      await authService.approveCollegeAdmin(id);
      toast.success('College Admin approved successfully!');
      fetchPendingAdmins();
    } catch (err) {
      toast.error('Failed to approve college admin.');
    }
  };

  const handleReject = async (id) => {
    try {
      await authService.rejectCollegeAdmin(id);
      toast.success('College Admin registration rejected.');
      fetchPendingAdmins();
    } catch (err) {
      toast.error('Failed to reject college admin.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-red-900/30 to-purple-950/40 border border-white/5 relative overflow-hidden shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Super Admin Dashboard</h1>
        <p className="text-gray-300">System control panel. Approve College Administrators and monitor system health.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <Building className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Pending College Admin Approvals</h2>
            <p className="text-xs text-gray-400">Review registration requests for College Administrators representing campuses.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : pendingAdmins.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
            No pending college admin requests.
          </div>
        ) : (
          <div className="overflow-hidden border border-white/5 rounded-xl bg-white/[0.02]">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-[#12101b]">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">College Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{admin.user_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{admin.college_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleApprove(admin.id)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(admin.id)}
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

export default SuperAdminDashboard;
