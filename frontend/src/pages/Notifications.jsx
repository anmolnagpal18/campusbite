import React, { useState, useEffect } from 'react';
import orderingService from '../services/ordering';

import { PageHeader } from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Bell, CreditCard, MessageSquare, ShoppingBag, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await orderingService.getNotifications(false); // get all history
      if (res && res.success && res.data) {
        const notifList = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setNotifications(notifList);
      }
    } catch (err) {
      toast.error('Failed to load notification history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await orderingService.markNotificationsRead();
      toast.success('All notifications marked as read.');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to update notifications status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await orderingService.deleteNotification(id);
      toast.success('Notification deleted.');
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      toast.error('Failed to delete notification.');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingBag className="h-5 w-5 text-purple-400" />;
      case 'PAYMENT':
        return <CreditCard className="h-5 w-5 text-emerald-400" />;
      case 'MESSAGE':
        return <MessageSquare className="h-5 w-5 text-blue-400" />;
      default:
        return <Bell className="h-5 w-5 text-amber-400" />;
    }
  };

  if (loading && notifications.length === 0) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="Notifications History" 
        description="Review receipts, status updates, and chat conversation alerts."
      />

      {notifications.length > 0 && (
        <div className="flex justify-end gap-4 border-b border-white/5 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            Mark All Read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState message="Your notification archive is empty." />
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {notifications.map((n) => (
            <Card 
              key={n.id} 
              className={`p-4 border border-white/5 bg-[#121020]/60 backdrop-blur-md flex gap-4 items-start transition-all ${
                !n.is_read ? 'ring-1 ring-purple-500/25 bg-purple-500/[0.01]' : ''
              }`}
            >
              <div className="p-2.5 bg-white/5 rounded-xl shrink-0 mt-0.5">
                {getIcon(n.notification_type)}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-xs font-bold text-gray-200">{n.title}</h4>
                  <span className="text-[10px] text-gray-500">
                    {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed break-words">{n.message}</p>
              </div>

              <button
                onClick={() => handleDelete(n.id)}
                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors shrink-0 mt-0.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
