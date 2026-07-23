import { useState, useEffect } from 'react';
import axiosClient from '../../config/axios';
import { Loader } from '../../components/Loader';
import toast from 'react-hot-toast';

const KitchenQueuePage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await axiosClient.get('/orders/kitchen/queue/');
      setOrders(res.data);
    } catch (err) {
      toast.error("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // In a real live environment, we would use WebSockets. Here we poll every 30s.
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await axiosClient.patch(`/orders/kitchen/${id}/status/`, { new_status: newStatus });
      toast.success("Order status updated!");
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Live Kitchen Queue</h1>
        <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
          {orders.length} Active Orders
        </div>
      </div>

      <div className="grid gap-4">
        {orders.map((order, idx) => (
          <div key={order.id} className="bg-white dark:bg-slate-800 border-l-4 border-l-blue-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl font-bold">#{order.booking_reference.slice(-5)}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  order.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 
                  order.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {order.priority}
                </span>
                <span className="text-sm font-semibold text-slate-500">Pos: {order.queue_position}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Est. Ready: {new Date(order.estimated_ready_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>

            <div className="flex gap-2">
              {order.status === 'CONFIRMED' && (
                <button 
                  onClick={() => updateStatus(order.id, 'PREPARING')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Start Preparing
                </button>
              )}
              {order.status === 'PREPARING' && (
                <button 
                  onClick={() => updateStatus(order.id, 'READY_FOR_PICKUP')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Mark Ready
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenQueuePage;
