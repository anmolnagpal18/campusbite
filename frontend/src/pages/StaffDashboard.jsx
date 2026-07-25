import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChefHat } from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-800/40 to-orange-950/40 border border-white/5 relative overflow-hidden shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Staff Portal</h1>
        <p className="text-gray-300">Welcome to your workspace. Manage food preparation and order queue.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/5">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl w-fit mb-4">
          <ChefHat className="h-6 w-6 text-amber-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-100">Order Management</h3>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          Order tracking and preparation management screens will appear here as features are added.
        </p>
      </div>
    </div>
  );
};

export default StaffDashboard;
