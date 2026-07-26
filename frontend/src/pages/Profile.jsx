import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import { User, Mail, Shield, ShieldCheck } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="My Account Settings" 
        description="View your user profile credentials and college registration details."
      />

      <Card className="max-w-xl mx-auto p-6 border border-white/5 bg-[#121020]/60 backdrop-blur-md space-y-6">
        <div className="flex gap-4 items-center">
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-3xl shrink-0">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-200 uppercase tracking-widest">{user?.email?.split('@')[0]}</h3>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block mt-0.5">{user?.role}</span>
          </div>
        </div>

        <div className="divide-y divide-white/5 border-t border-white/5 pt-4 space-y-4 text-xs">
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-purple-400" />
              Email Address:
            </span>
            <span className="font-bold text-gray-200">{user?.email}</span>
          </div>

          <div className="flex justify-between items-center pt-4">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-purple-400" />
              Role Authorization:
            </span>
            <span className="px-2 py-0.5 rounded font-black text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wide">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          <div className="flex justify-between items-center pt-4">
            <span className="text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              Account Status:
            </span>
            <StatusBadge status="APPROVED" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
