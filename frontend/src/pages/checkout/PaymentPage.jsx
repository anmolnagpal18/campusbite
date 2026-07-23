import { useState, useEffect } from 'react';
import { useRazorpay } from '../../hooks/useRazorpay';
import axiosClient from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Loader } from '../../components/Loader';
import toast from 'react-hot-toast';

const PaymentPage = ({ bookingId }) => {
  useRazorpay(); // Ensure razorpay script is loaded
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    // In a real app, we might fetch the booking details here to display a receipt 
    // before the user clicks "Pay Now". For this phase, we assume the bookingId is passed down.
  }, [bookingId]);

  const handlePayment = async () => {
    if (!window.Razorpay) {
      toast.error("Payment SDK failed to load. Please check your connection.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Order on Backend
      const orderRes = await axiosClient.post('/payments/create-order/', {
        pre_booking_id: bookingId
      });

      const { razorpay_order_id, amount, currency, key } = orderRes.data;

      // 2. Initialize Razorpay Checkout
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: "CampusBite AI",
        description: "Food Pre-Booking Payment",
        order_id: razorpay_order_id,
        handler: async function (response) {
          // 3. Verify Payment on Backend
          try {
            await axiosClient.post('/payments/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            toast.success("Payment Successful! Your order is now Confirmed.");
            // Redirect to success page or update UI
            window.location.href = '/booking-success';
            
          } catch (verifyErr) {
            toast.error("Payment verification failed on the server.");
            window.location.href = '/payment-failed';
          }
        },
        prefill: {
          name: user?.first_name || 'Student',
          email: user?.email || '',
        },
        theme: {
          color: "#2563EB" // Tailwind blue-600
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to initialize payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Complete Your Payment</h2>
      <p className="text-slate-500 mb-8">Securely pay for your pre-booking to confirm your pickup slot.</p>
      
      <button 
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl transition shadow-md flex justify-center items-center gap-2"
      >
        {loading ? <Loader /> : 'Pay via Razorpay'}
      </button>
      
      <div className="mt-6 text-xs text-slate-400 flex items-center justify-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        Payments are secure and encrypted
      </div>
    </div>
  );
};

export default PaymentPage;
