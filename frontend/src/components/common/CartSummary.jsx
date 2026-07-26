import React from 'react';
import Card from './Card';
import Button from './Button';
import { ShoppingCart } from 'lucide-react';

export const CartSummary = ({ cart, orderType, onCheckoutClick }) => {
  if (!cart || !cart.items || cart.items.length === 0) return null;

  const subtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const instantCharge = orderType === 'INSTANT' ? 10.00 : 0.00;
  const gst = 0.00; // GST placeholder
  const grandTotal = subtotal + instantCharge + gst;

  return (
    <Card className="p-6 border border-white/5 bg-[#121020]/60 backdrop-blur-md space-y-4">
      <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-purple-400" />
        Order Summary
      </h3>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-gray-400">
          <span>Items Subtotal</span>
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
          <span>Grand Total</span>
          <span className="text-purple-400">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {onCheckoutClick && (
        <Button
          variant="primary"
          className="w-full py-3 text-xs"
          onClick={onCheckoutClick}
        >
          Proceed to Checkout
        </Button>
      )}
    </Card>
  );
};

export default CartSummary;
