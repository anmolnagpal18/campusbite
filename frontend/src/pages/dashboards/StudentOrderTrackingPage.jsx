import { useState, useEffect } from 'react';
import axiosClient from '../../config/axios';
import { Loader } from '../../components/Loader';

const StudentOrderTrackingPage = ({ bookingId }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Mock fallback to /pre-bookings/ if we don't have a dedicated student tracking endpoint yet
        const res = await axiosClient.get(`/pre-bookings/${bookingId}/`);
        setBooking(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchOrder();
  }, [bookingId]);

  if (loading) return <Loader />;
  if (!booking) return <div>Order not found</div>;

  const steps = [
    { label: "Confirmed", status: "CONFIRMED", completed: !!booking.confirmed_at },
    { label: "Preparing", status: "PREPARING", completed: !!booking.preparing_at },
    { label: "Ready", status: "READY_FOR_PICKUP", completed: !!booking.ready_at },
    { label: "Completed", status: "COMPLETED", completed: !!booking.completed_at },
  ];

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold text-center mb-6">Track Order #{booking.booking_reference.slice(-5)}</h2>
      
      {booking.estimated_ready_at && booking.status !== 'COMPLETED' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center mb-8">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Estimated Ready Time</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {new Date(booking.estimated_ready_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
          <p className="text-xs text-slate-500 mt-1">Queue Position: {booking.queue_position}</p>
        </div>
      )}

      <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8">
        {steps.map((step, idx) => (
          <div key={idx} className="relative pl-6">
            <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-1 border-2 border-white dark:border-slate-800 ${
              step.completed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}></div>
            <h3 className={`font-bold ${step.completed ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              {step.label}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentOrderTrackingPage;
