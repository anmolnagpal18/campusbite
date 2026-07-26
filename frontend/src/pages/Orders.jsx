import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import orderingService from '../services/ordering';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';
import OrderTimeline from '../components/common/OrderTimeline';
import QRDisplay from '../components/common/QRDisplay';
import Modal from '../components/common/Modal';
import { ClipboardList, QrCode, XCircle, Play, CheckCircle2, ChevronDown, ChevronUp, MessageSquare, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const Orders = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const focusOrderId = searchParams.get('orderId');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const isVendorOrStaff = ['VENDOR', 'STAFF'].includes(user?.role);
  const [activeTab, setActiveTab] = useState(isVendorOrStaff ? 'PENDING' : 'ACTIVE');
  
  // UI Expansion
  const [expandedOrderId, setExpandedOrderId] = useState(focusOrderId ? parseInt(focusOrderId) : null);
  
  // Modals
  const [qrModalOrder, setQrModalOrder] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderingService.getOrders();
      if (res && res.success && res.data) {
        const orderList = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setOrders(orderList);
      }
    } catch (err) {
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, nextStatus, reason = '') => {
    setActionLoading(true);
    try {
      const res = await orderingService.updateOrderStatus(orderId, nextStatus, reason);
      if (res && res.success) {
        toast.success(`Order status updated to ${nextStatus.toLowerCase()}.`);
        fetchOrders();
        setCancelModalOrder(null);
        setCancelReason('');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const getFilteredOrders = () => {
    if (isVendorOrStaff) {
      // Vendor/Staff tabs: PENDING, PREPARING, READY, COMPLETED, CANCELLED
      return orders.filter(o => o.status === activeTab);
    } else {
      // User tabs: ACTIVE (PENDING/PREPARING/READY), COMPLETED, CANCELLED
      if (activeTab === 'ACTIVE') {
        return orders.filter(o => ['PENDING', 'PREPARING', 'READY'].includes(o.status));
      }
      return orders.filter(o => o.status === activeTab);
    }
  };

  const filteredOrders = getFilteredOrders();

  if (loading && orders.length === 0) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title={isVendorOrStaff ? 'Incoming Orders Management' : 'My Orders'} 
        description={isVendorOrStaff ? 'Track customer orders, update food prep progress, and scan QR pickup codes.' : 'View order histories, pickup statuses, and download collection QR codes.'}
      />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {isVendorOrStaff ? (
          <>
            {['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-purple-600 border border-purple-500 text-white shadow-lg shadow-purple-600/10'
                    : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()} ({orders.filter(o => o.status === tab).length})
              </button>
            ))}
          </>
        ) : (
          <>
            {[
              { id: 'ACTIVE', label: 'Active Orders', count: orders.filter(o => ['PENDING', 'PREPARING', 'READY'].includes(o.status)).length },
              { id: 'COMPLETED', label: 'Completed', count: orders.filter(o => o.status === 'COMPLETED').length },
              { id: 'CANCELLED', label: 'Cancelled', count: orders.filter(o => o.status === 'CANCELLED').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-purple-600 border border-purple-500 text-white shadow-lg shadow-purple-600/10'
                    : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </>
        )}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState message="No orders found matching this category." />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <Card 
                key={order.id} 
                className={`border border-white/5 bg-[#121020]/60 backdrop-blur-md overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'ring-1 ring-purple-500/20' : ''
                }`}
              >
                {/* Collapsed Header */}
                <div 
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-200">{order.order_number}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-[11px] text-gray-400 font-semibold">
                      {isVendorOrStaff ? `Customer: ${order.customer_email}` : `Canteen: ${order.restaurant_details?.restaurant_name}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <span className="text-xs font-black text-purple-400 block">₹{parseFloat(order.grand_total).toFixed(2)}</span>
                      <span className="text-[10px] text-gray-500 block">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-white/5 space-y-6 animate-slide-down">
                    {/* Visual Progress Timeline */}
                    <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                      <OrderTimeline status={order.status} />
                      {order.status === 'CANCELLED' && order.cancel_reason && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 flex gap-2 items-start">
                          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>Cancellation Reason: {order.cancel_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Items</h4>
                      <div className="divide-y divide-white/[0.03] space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="pt-2 flex justify-between items-center text-xs first:pt-0">
                            <span className="text-gray-300 font-medium">
                              {item.food_item_details?.item_name} <span className="text-purple-400 font-extrabold ml-1">x{item.quantity}</span>
                            </span>
                            <span className="text-gray-400">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
                      {/* Customer Actions */}
                      {!isVendorOrStaff && (
                        <div className="flex gap-3 w-full sm:w-auto justify-end ml-auto">
                          {order.status === 'PENDING' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setCancelModalOrder(order);
                              }}
                              icon={<XCircle className="h-4 w-4" />}
                            >
                              Cancel Order
                            </Button>
                          )}
                          {order.payment_status === 'SUCCESS' && !order.qr_expired && ['PENDING', 'PREPARING', 'READY'].includes(order.status) && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setQrModalOrder(order)}
                              icon={<QrCode className="h-4 w-4" />}
                            >
                              Show QR Code
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Vendor / Staff Actions */}
                      {isVendorOrStaff && (
                        <div className="flex flex-wrap gap-3 w-full justify-between items-center">
                          <span className="text-[11px] text-gray-400 font-semibold">
                            Type: <span className="text-gray-200 uppercase font-black">{order.order_type}</span>
                            {order.pickup_time && ` • Pickup: ${new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </span>

                          <div className="flex gap-3">
                            {/* Cancellation (Vendor only) */}
                            {user.role === 'VENDOR' && ['PENDING', 'PREPARING', 'READY'].includes(order.status) && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setCancelModalOrder(order)}
                                icon={<XCircle className="h-4 w-4" />}
                              >
                                Cancel Order
                              </Button>
                            )}

                            {/* Status Steppers */}
                            {order.status === 'PENDING' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                icon={<Play className="h-4 w-4" />}
                              >
                                Accept & Prepare
                              </Button>
                            )}

                            {order.status === 'PREPARING' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUpdateStatus(order.id, 'READY')}
                                icon={<CheckCircle2 className="h-4 w-4" />}
                              >
                                Food Ready
                              </Button>
                            )}

                            {order.status === 'READY' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => navigate(ROUTES.QR_SCANNER)}
                                icon={<QrCode className="h-4 w-4" />}
                              >
                                Scan QR to Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Modal */}
      {qrModalOrder && (
        <Modal
          isOpen={!!qrModalOrder}
          onClose={() => setQrModalOrder(null)}
          title="Pick up Verification"
        >
          <div className="py-4">
            <QRDisplay order={qrModalOrder} />
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOrder && (
        <Modal
          isOpen={!!cancelModalOrder}
          onClose={() => {
            setCancelModalOrder(null);
            setCancelReason('');
          }}
          title="Cancel Order"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Are you sure you want to cancel order <span className="text-purple-400 font-bold">{cancelModalOrder.order_number}</span>? This action will refund the payment and return items to stock.
            </p>
            {user.role === 'VENDOR' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cancellation Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Ingredients out of stock..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-white/5 bg-[#0a0815] text-gray-200 focus:outline-none focus:border-purple-500 min-h-20"
                />
              </div>
            )}
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModalOrder(null);
                  setCancelReason('');
                }}
              >
                No, Keep Order
              </Button>
              <Button
                variant="danger"
                onClick={() => handleUpdateStatus(cancelModalOrder.id, 'CANCELLED', cancelReason)}
                loading={actionLoading}
              >
                Yes, Cancel Order
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
