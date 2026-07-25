import React from 'react';

export const StatSkeleton = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-white/5 animate-pulse flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-3 bg-white/10 rounded w-24"></div>
        <div className="h-8 bg-white/15 rounded w-16"></div>
      </div>
      <div className="h-12 w-12 rounded-2xl bg-white/10"></div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="animate-pulse space-y-4 px-6 py-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-4 bg-white/15 rounded w-1/3"></div>
            <div className="h-4 bg-white/10 rounded w-1/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/6 hidden sm:block"></div>
          </div>
          <div className="h-8 bg-white/15 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-white/5 animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-white/15 rounded w-32"></div>
          <div className="h-3 bg-white/10 rounded w-20"></div>
        </div>
        <div className="h-6 w-16 bg-white/10 rounded-md"></div>
      </div>
      <div className="h-48 bg-white/5 rounded-xl flex items-end justify-between p-4 gap-2">
        <div className="h-[20%] w-full bg-white/10 rounded-t"></div>
        <div className="h-[40%] w-full bg-white/10 rounded-t"></div>
        <div className="h-[30%] w-full bg-white/10 rounded-t"></div>
        <div className="h-[75%] w-full bg-white/10 rounded-t"></div>
        <div className="h-[50%] w-full bg-white/10 rounded-t"></div>
        <div className="h-[90%] w-full bg-white/10 rounded-t"></div>
      </div>
    </div>
  );
};
