import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderingService from '../services/ordering';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import CheckoutSummary from '../components/common/CheckoutSummary';
import { Trash2, ShoppingBag, Clock, Plus, Minus, ArrowLeft, Calendar, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Checkout choices
  const [orderType, setOrderType] = useState('INSTANT');
  const [pickupTime, setPickupTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await orderingService.getCart();
      if (res && res.success) {
        setCart(res.data);
      }
    } catch (err) {
      toast.error('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Generate preorder pickup slots
  useEffect(() => {
    if (!cart || !cart.restaurant_details) return;
    
    const slots = [];
    const now = new Date();
    
    // Minimum 1 hour in future
    const minTime = new Date(now.getTime() + 60 * 60 * 1000);
    // Round to next 15-minute boundary
    const minutes = minTime.getMinutes();
    const rem = minutes % 15;
    if (rem > 0) {
      minTime.setMinutes(minutes + (15 - rem));
    }
    minTime.setSeconds(0);
    minTime.setMilliseconds(0);

    // Closing time parsing
    const closingTimeStr = cart.restaurant_details.closing_time || '21:00:00';
    const [closeH, closeM] = closingTimeStr.split(':').map(Number);
    
    const closingTime = new Date(now.getTime());
    closingTime.setHours(closeH, closeM, 0, 0);

    let temp = new Date(minTime.getTime());
    while (temp <= closingTime) {
      slots.push(new Date(temp.getTime()));
      // Advance by 15 mins
      temp.setMinutes(temp.getMinutes() + 15);
    }

    setAvailableSlots(slots);
    if (slots.length > 0) {
      setPickupTime(slots[0].toISOString());
    } else {
      setPickupTime('');
    }
  }, [cart, orderType]);

  const handleUpdateQty = async (itemId, newQty) => {
    try {
      const res = await orderingService.updateCartItem(itemId, newQty);
      if (res && res.success) {
        setCart(res.data);
        toast.success('Cart updated.');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update item quantity.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const res = await orderingService.deleteCartItem(itemId);
      if (res && res.success) {
        setCart(res.data);
        toast.success('Item removed from cart.');
      }
    } catch (err) {
      toast.error('Failed to remove item.');
    }
  };

  const handleClearCart = async () => {
    try {
      await orderingService.clearCart();
      setCart({ items: [] });
      toast.success('Cart cleared.');
    } catch (err) {
      toast.error('Failed to clear cart.');
    }
  };

  const handleCheckout = async () => {
    if (orderType === 'PREORDER' && !pickupTime) {
      toast.error('Please select a pickup time slot for pre-ordering.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await orderingService.checkout(orderType, orderType === 'PREORDER' ? pickupTime : null);
      if (res && res.success && res.data) {
        toast.success('Order placed and paid successfully!');
        // Redirect to success page
        navigate(ROUTES.ORDER_SUCCESS.replace(':id', res.data.id));
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) return <Loader />;

  const hasItems = cart && cart.items && cart.items.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="Your Shopping Cart" 
        description="Verify your order, select pickup method, and checkout securely."
      />

      {!hasItems ? (
        <div className="text-center py-16 space-y-4">
          <div className="p-4 bg-white/5 border border-white/5 rounded-3xl text-gray-500 inline-block shadow-xl">
            <ShoppingBag className="h-10 w-10 text-purple-400" />
          </div>
          <h4 className="text-base font-bold text-gray-200">Your cart is empty</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Start adding delicious items from your campus stalls to checkout!
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.BROWSE_FOOD)}
            className="text-xs"
          >
            Browse Food Court
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Restaurant header banner */}
            <div className="glass-card p-4 rounded-2xl border border-white/5 bg-[#121020]/60 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block">Ordering from</span>
                <h4 className="text-sm font-bold text-gray-200">{cart.restaurant_details?.restaurant_name}</h4>
              </div>
              <button
                onClick={handleClearCart}
                className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Cart
              </button>
            </div>

            <div className="space-y-4">
              {cart.items.map((item) => {
                const sub = parseFloat(item.price) * item.quantity;
                return (
                  <Card key={item.id} className="p-4 border border-white/5 bg-[#121020]/60 backdrop-blur-md flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-gray-200 truncate">{item.food_item_details?.item_name}</h4>
                      <span className="text-[10px] font-black text-purple-400 mt-1 block">₹{parseFloat(item.price).toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Qty actions */}
                      <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl p-1">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          className="p-1 text-purple-400 hover:text-white rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-gray-100">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="p-1 text-purple-400 hover:text-white rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-gray-200 w-16 text-right">₹{sub.toFixed(2)}</span>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Back to stall link */}
            <button
              onClick={() => navigate(ROUTES.RESTAURANT_DETAILS.replace(':id', cart.restaurant))}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Add more items
            </button>
          </div>

          {/* Checkout controls */}
          <div className="space-y-6">
            {/* Order Method Card */}
            <Card className="p-6 border border-white/5 bg-[#121020]/60 backdrop-blur-md space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-purple-400" />
                Select Pickup Method
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setOrderType('INSTANT')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    orderType === 'INSTANT'
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Instant Order
                  <span className="text-[9px] text-gray-400 font-normal">Adds ₹10 service fee</span>
                </button>

                <button
                  onClick={() => setOrderType('PREORDER')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    orderType === 'PREORDER'
                      ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Pre-Order
                  <span className="text-[9px] text-gray-400 font-normal">Schedule pickup</span>
                </button>
              </div>

              {orderType === 'PREORDER' && (
                <div className="space-y-2 pt-2 border-t border-white/5 animate-fade-in">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-purple-400" />
                    Available Pickup Slots
                  </label>
                  {availableSlots.length > 0 ? (
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-white/5 bg-[#0a0815] text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      {availableSlots.map((slot, idx) => (
                        <option key={idx} value={slot.toISOString()}>
                          {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px]">
                      <Info className="h-4 w-4 shrink-0" />
                      <span>Pre-ordering is closed for today. Stalls closing soon. Please select Instant Order.</span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <CheckoutSummary 
              cart={cart} 
              orderType={orderType} 
              pickupTime={orderType === 'PREORDER' && pickupTime ? new Date(pickupTime) : null}
              onPayClick={handleCheckout}
              loading={checkoutLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
