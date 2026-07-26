import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderingService from '../services/ordering';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import QRDisplay from '../components/common/QRDisplay';
import { CheckCircle, ArrowRight, ShoppingBag, CreditCard, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await orderingService.getOrderDetail(id);
        if (res && res.success) {
          setOrder(res.data);
        }
      } catch (err) {
        toast.error('Failed to load order confirmation.');
        navigate(ROUTES.USER_DASHBOARD);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <Loader />;
  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6 animate-fade-in text-center">
      {/* Success banner */}
      <div className="space-y-4">
        <div className="inline-block p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 shadow-xl shadow-emerald-500/5">
          <CheckCircle className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-black text-gray-100 tracking-tight">Order Placed & Paid!</h2>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Your order has been sent to the canteen kitchen. Track its status below or show the QR code at the counter for pickup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left items-start">
        {/* Order & Payment info */}
        <Card className="p-6 border border-white/5 bg-[#121020]/60 backdrop-blur-md space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5 pb-3 border-b border-white/5">
            <ShoppingBag className="h-4 w-4" />
            Order Details
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Order Number:</span>
              <span className="font-extrabold text-gray-200">{order.order_number}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Canteen Stall:</span>
              <span className="font-bold text-gray-200">{order.restaurant_details?.restaurant_name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Pickup Mode:</span>
              <span className="px-2 py-0.5 rounded font-black text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                {order.order_type === 'INSTANT' ? 'Instant Order' : 'Pre Order'}
              </span>
            </div>

            {order.order_type === 'PREORDER' && order.pickup_time && (
              <div className="flex justify-between items-center bg-purple-500/5 p-2 rounded-xl border border-purple-500/10 text-purple-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Scheduled Pickup:
                </span>
                <span className="font-bold">
                  {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5 pt-4 pb-3 border-t border-white/5">
            <CreditCard className="h-4 w-4" />
            Payment Status
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction ID:</span>
              <span className="font-mono text-[10px] text-gray-300">{order.payment?.transaction_id || 'MOCK-TXN'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Total Paid:</span>
              <span className="font-extrabold text-emerald-400">₹{parseFloat(order.grand_total).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* QR Display */}
        <QRDisplay order={order} />
      </div>

      <div className="pt-6 flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(ROUTES.USER_DASHBOARD)}
          className="text-xs"
        >
          Go to Dashboard
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate(ROUTES.ORDERS)}
          className="text-xs"
          icon={<ArrowRight className="h-4 w-4" />}
        >
          Track All Orders
        </Button>
      </div>
    </div>
  );
};

export default OrderSuccess;
