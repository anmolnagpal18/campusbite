import React from 'react';
import { LineChart, BarChart2, TrendingUp } from 'lucide-react';
import Card from './Card';
import EmptyState from './EmptyState';

export const RevenueChart = ({ revenue = 0 }) => {
  const hasData = revenue > 0;

  return (
    <Card className="flex flex-col h-80 justify-between">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div>
          <h4 className="text-sm font-bold text-gray-200">Revenue Performance</h4>
          <p className="text-xs text-gray-400">Daily earnings & metrics</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <TrendingUp className="h-3 w-3" />
          +0.0%
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {!hasData ? (
          <EmptyState
            title="No revenue data available yet"
            message="Revenue details will appear here once customers start placing orders."
            icon={<LineChart className="h-10 w-10 text-gray-500" />}
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-end p-2">
            <svg className="w-full h-32 text-purple-500" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
                  <stop offset="100%" stopColor="rgba(168, 85, 247, 0.0)" />
                </linearGradient>
              </defs>
              <path
                d="M0,30 Q25,10 50,20 T100,5 L100,30 L0,30 Z"
                fill="url(#gradient)"
              />
              <path
                d="M0,30 Q25,10 50,20 T100,5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>9:00 AM</span>
              <span>12:00 PM</span>
              <span>3:00 PM</span>
              <span>6:00 PM</span>
              <span>9:00 PM</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export const OrderVolumeChart = ({ preparing = 0, ready = 0 }) => {
  const total = preparing + ready;
  const hasData = total > 0;

  return (
    <Card className="flex flex-col h-80 justify-between">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div>
          <h4 className="text-sm font-bold text-gray-200">Active Order Volume</h4>
          <p className="text-xs text-gray-400">Real-time status breakdown</p>
        </div>
        <span className="text-xs font-semibold text-gray-400">Total: {total}</span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {!hasData ? (
          <EmptyState
            title="No active orders"
            message="Active orders will automatically display here once customers place them."
            icon={<BarChart2 className="h-10 w-10 text-gray-500" />}
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-around px-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-amber-400">Preparing ({preparing})</span>
                <span className="text-gray-400">{Math.round((preparing / total) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${(preparing / total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-400">Ready for Pickup ({ready})</span>
                <span className="text-gray-400">{Math.round((ready / total) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${(ready / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
