import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line
} from 'recharts';
import Card from './Card';
import { HelpCircle } from 'lucide-react';

const COLORS = ['#818cf8', '#fbbf24', '#34d399', '#f87171', '#a78bfa', '#22d3ee', '#e879f9'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rawData = payload[0].payload;
    let title = label;
    if (rawData.date) {
      const dateObj = new Date(rawData.date);
      if (!isNaN(dateObj.getTime())) {
        title = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    return (
      <div className="bg-[#121020]/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-purple-300">{title}</p>
        {payload.map((p, idx) => (
          <p key={idx} style={{ color: p.color || p.fill }} className="font-extrabold">
            {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') ? `₹${p.value.toFixed(2)}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Area Chart (Revenue Trend)
export const RevenueAreaChart = ({ data = [], height = 300, yKey = "Revenue" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.005] h-[300px]">
        <HelpCircle className="h-8 w-8 text-gray-600 mb-2" />
        <span className="text-xs font-bold text-gray-400">No revenue data available yet</span>
        <p className="text-[10px] text-gray-500 mt-1">Analytics will automatically appear after your first completed order.</p>
      </div>
    );
  }

  const formatTick = (value) => {
    const item = data.find(d => d.date === value || d.day_name === value);
    if (item && item.date && item.day_name) {
      const dayNum = item.date.split('-')[2];
      return `${item.day_name} ${dayNum}`;
    }
    return value;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis 
            dataKey={data[0]?.date ? "date" : "day_name"} 
            stroke="#9ca3af" 
            fontSize={10} 
            tickLine={false} 
            tickFormatter={formatTick}
          />
          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={yKey} stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Bar Chart (Top Selling Foods)
export const FoodsBarChart = ({ data = [], height = 300, yKey = "Orders" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.005] h-[300px]">
        <HelpCircle className="h-8 w-8 text-gray-600 mb-2" />
        <span className="text-xs font-bold text-gray-400">No popular food items yet</span>
        <p className="text-[10px] text-gray-500 mt-1">Popular foods will appear here after orders are completed.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} />
          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={yKey} fill="#8b5cf6" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 3. Status Pie Chart
export const StatusPieChart = ({ data = [], height = 300 }) => {
  const hasValues = data.some(d => d.value > 0);
  
  if (!data || data.length === 0 || !hasValues) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.005] h-[300px]">
        <HelpCircle className="h-8 w-8 text-gray-600 mb-2" />
        <span className="text-xs font-bold text-gray-400">No orders data yet</span>
        <p className="text-[10px] text-gray-500 mt-1">Order status breakdowns appear here after orders are received.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }} className="flex flex-col justify-center">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data.filter(d => d.value > 0)}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => <span className="text-xs font-semibold text-gray-400">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 4. Line Chart (Revenue Trend 30 Days)
export const RevenueLineChart = ({ data = [], height = 300, yKey = "Revenue" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.005] h-[300px]">
        <HelpCircle className="h-8 w-8 text-gray-600 mb-2" />
        <span className="text-xs font-bold text-gray-400">No trend data available</span>
        <p className="text-[10px] text-gray-500 mt-1">Trend lines appear after completed transactions are recorded.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={9} tickLine={false} />
          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey={yKey} stroke="#34d399" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
