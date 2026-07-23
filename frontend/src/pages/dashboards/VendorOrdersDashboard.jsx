import { useState, useEffect } from 'react';
import axiosClient from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Loader } from '../../components/Loader';
import { EmptyState } from '../../components/EmptyState';
import { OrderTimeline } from '../../components/OrderTimeline';
import toast from 'react-hot-toast';

const VendorOrdersDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const response = await axiosClient.get('/pre-bookings/');
      setBookings(response.data.results || response.data);
    } catch (err) {
      toast.error('Failed to load incoming orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await axiosClient.patch(`/pre-bookings/${id}/`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      fetchBookings();
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  if (loading) return <Loader />;

  if (bookings.length === 0) return (
    <div className="p-8"><EmptyState title="No active orders" message="When students book food, it will appear here." /></div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Live Order Kitchen</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage incoming pre-bookings and prepare food for pickup.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="font-mono font-bold text-slate-900 dark:text-white">{booking.booking_reference}</p>
                <p className="text-xs text-slate-500">{booking.student_name} • Pickup: {booking.pickup_date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-green-600 dark:text-green-400">₹{booking.total}</p>
              </div>
            </div>

            <div className="p-6">
              <OrderTimeline currentStatus={booking.status} />
              
              <div className="mt-6 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Order Items</h4>
                {booking.items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{item.quantity}x</span> {item.menu_item_name}
                      {item.variant_name && <span className="text-slate-500 ml-1">({item.variant_name})</span>}
                      {item.addons_snapshot?.map((addon, idx) => (
                        <p key={idx} className="text-xs text-slate-400 pl-5">+ {addon.qty}x {addon.name}</p>
                      ))}
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">₹{item.total_price}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                {booking.status === 'PENDING' && (
                  <button onClick={() => updateStatus(booking.id, 'PREPARING')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg">Accept & Prepare</button>
                )}
                {booking.status === 'PREPARING' && (
                  <button onClick={() => updateStatus(booking.id, 'READY_FOR_PICKUP')} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg">Mark Ready for Pickup</button>
                )}
                {booking.status === 'READY_FOR_PICKUP' && (
                  <button onClick={() => updateStatus(booking.id, 'COMPLETED')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg">Complete Order (Picked Up)</button>
                )}
                {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                  <button onClick={() => updateStatus(booking.id, 'CANCELLED')} className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 font-bold py-2 rounded-lg">Cancel</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorOrdersDashboard;
