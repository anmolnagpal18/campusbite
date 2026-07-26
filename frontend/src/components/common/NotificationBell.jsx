import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CreditCard, MessageSquare, ShoppingBag, ShieldAlert, Check } from 'lucide-react';
import orderingService from '../../services/ordering';
import ROUTES from '../../routes/constants';
import toast from 'react-hot-toast';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await orderingService.getNotifications(true);
      if (res && res.success && res.data) {
        const notifList = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setUnreadCount(notifList.length);
        setNotifications(notifList.slice(0, 5)); // show latest 5
      }
    } catch (err) {
      console.error('Failed to fetch unread notifications', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 6000);
    
    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await orderingService.markNotificationsRead();
      setUnreadCount(0);
      setNotifications([]);
      toast.success('All notifications marked as read.');
      setIsOpen(false);
    } catch (err) {
      toast.error('Failed to mark notifications read.');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingBag className="h-4 w-4 text-purple-400" />;
      case 'PAYMENT':
        return <CreditCard className="h-4 w-4 text-emerald-400" />;
      case 'MESSAGE':
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors focus:outline-none cursor-pointer"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[9px] font-black text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/5 bg-[#0f0d1a] p-4 shadow-2xl z-50 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-gray-200">Recent Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-white/[0.03]">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">No unread notifications.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="pt-2 flex gap-3 items-start first:pt-0">
                  <div className="p-2 bg-white/5 rounded-lg shrink-0 mt-0.5">
                    {getIcon(n.notification_type)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="text-[11px] font-bold text-gray-200 truncate">{n.title}</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed break-words">{n.message}</p>
                    <span className="text-[9px] text-gray-500 block">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/5 pt-2 text-center">
            <button
              onClick={() => {
                navigate(ROUTES.NOTIFICATIONS);
                setIsOpen(false);
              }}
              className="text-[11px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 w-full py-1.5 cursor-pointer"
            >
              View all history
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
