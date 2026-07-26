import React from 'react';
import Card from './Card';
import Button from './Button';
import { CreditCard, Truck, Calendar } from 'lucide-react';

export const CheckoutSummary = ({ cart, orderType, pickupTime, onPayClick, loading }) => {
  if (!cart || !cart.items || cart.items.length === 0) return null;

  const subtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const instantCharge = orderType === 'INSTANT' ? 10.00 : 0.00;
  const gst = 0.00;
  const grandTotal = subtotal + instantCharge + gst;

  return (
    <Card className="p-6 border border-white/5 bg-[#121020]/60 backdrop-blur-md space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-purple-400" />
          Checkout Summary
        </h3>

        {/* Selected parameters */}
        <div className="space-y-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Order Method:</span>
            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${
              orderType === 'INSTANT' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
            }`}>
              {orderType === 'INSTANT' ? 'Instant Order' : 'Pre Order'}
            </span>
          </div>

          {orderType === 'PREORDER' && pickupTime && (
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-gray-400 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                Pickup Slot:
              </span>
              <span className="font-semibold text-gray-200">
                {new Date(pickupTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bill breakdown */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-gray-400">
          <span>Subtotal</span>
          <span className="font-semibold text-gray-200">₹{subtotal.toFixed(2)}</span>
        </div>

        {orderType === 'INSTANT' && (
          <div className="flex justify-between text-gray-400">
            <span>Instant Order Service Fee</span>
            <span className="font-semibold text-purple-400">₹{instantCharge.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-400">
          <span>GST (0%)</span>
          <span className="font-semibold text-gray-200">₹{gst.toFixed(2)}</span>
        </div>

        <div className="pt-3 border-t border-white/5 flex justify-between text-sm font-extrabold text-gray-100">
          <span>Amount Payable</span>
          <span className="text-purple-400">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <Button
        variant="success"
        className="w-full py-3 text-xs"
        onClick={onPayClick}
        loading={loading}
        disabled={loading}
        icon={<CreditCard className="h-4 w-4" />}
      >
        Pay Now (₹{grandTotal.toFixed(2)})
      </Button>
    </Card>
  );
};

export default CheckoutSummary;
