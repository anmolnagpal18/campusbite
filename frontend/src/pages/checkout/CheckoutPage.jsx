import { useState, useEffect } from 'react';
import axiosClient from '../../config/axios';
import { Loader } from '../../components/Loader';
import { EmptyState } from '../../components/EmptyState';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const [cart, setCart] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const cartRes = await axiosClient.get('/carts/');
        if (cartRes.data.length > 0) {
          const activeCart = cartRes.data[0];
          setCart(activeCart);
          
          if (activeCart.vendor) {
            const slotsRes = await axiosClient.get(`/pickup-slots/?vendor=${activeCart.vendor}&slot_status=OPEN`);
            setSlots(slotsRes.data.results || slotsRes.data);
          }
        }
      } catch (err) {
        toast.error("Failed to load checkout details");
      } finally {
        setLoading(false);
      }
    };
    fetchCheckoutData();
  }, []);

  const handleCheckout = async () => {
    if (!selectedSlot) return toast.error("Please select a pickup time.");
    
    setSubmitting(true);
    try {
      const response = await axiosClient.post('/pre-bookings/', {
        cart: cart.id,
        pickup_slot: selectedSlot.id,
        notes: "Checkout submitted"
      });
      setSuccessBooking(response.data);
      toast.success("Order Placed Successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Checkout failed due to capacity changes.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  if (successBooking) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-lg mt-10">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Order Confirmed!</h1>
        <p className="text-slate-500 mb-6">Your booking reference is <strong className="text-slate-900 dark:text-white">{successBooking.booking_reference}</strong></p>
        <p className="text-sm bg-slate-50 dark:bg-slate-700 p-4 rounded-lg inline-block">Please pick up your food on {successBooking.pickup_date} at the designated time.</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) return <div className="mt-10 max-w-2xl mx-auto"><EmptyState title="Your cart is empty" message="Add some food before checking out." /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Cart Review */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">Review Order</h2>
          <div className="space-y-4">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between py-4 border-b border-slate-50 dark:border-slate-700 last:border-0">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white">{item.menu_item_name}</h4>
                  {item.variant_name && <p className="text-sm text-slate-500">Variant: {item.variant_name}</p>}
                  {item.addons?.map(addon => (
                    <p key={addon.id} className="text-xs text-slate-400">+ {addon.quantity}x {addon.addon_name}</p>
                  ))}
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">₹{item.total_price}</p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slot Selection */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">Select Pickup Time</h2>
          {slots.length === 0 ? (
            <p className="text-red-500">No open pickup slots available for this vendor right now.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {slots.map(slot => (
                <div 
                  key={slot.id} 
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${selectedSlot?.id === slot.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}
                >
                  <p className="font-bold text-slate-900 dark:text-white">{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</p>
                  <p className="text-xs text-slate-500 mt-1">{slot.capacity - slot.current_bookings} spots left</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">Order Summary</h2>
          <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span>Subtotal</span>
            <span>₹{cart.subtotal}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <span>Taxes & Fees</span>
            <span>₹0.00</span>
          </div>
          <div className="flex justify-between font-bold text-2xl text-slate-900 dark:text-white mb-6">
            <span>Total</span>
            <span>₹{cart.total}</span>
          </div>
          <button 
            disabled={submitting || !selectedSlot}
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl transition shadow-md"
          >
            {submitting ? 'Processing...' : 'Confirm Pre-Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
