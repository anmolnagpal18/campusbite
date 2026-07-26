import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Users, LogOut, Menu, X, Building, Store, Shield, ChefHat, MessageSquare, ShoppingBag, Bell,
  ShoppingCart, ClipboardList, QrCode, User as UserIcon, BarChart2
} from 'lucide-react';
import ROUTES from '../routes/constants';
import chatService from '../services/chat';
import NotificationBell from '../components/common/NotificationBell';
import orderingService from '../services/ordering';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user || user.role === 'USER') return;

    const fetchUnread = async () => {
      try {
        const res = await chatService.getUnreadCount();
        if (res && res.success && res.data) {
          setUnreadCount(res.data.total_unread);
        }
      } catch (err) {
        console.error('Failed to load unread messages count', err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'USER') return;

    const fetchCartCount = async () => {
      try {
        const res = await orderingService.getCart();
        if (res && res.success && res.data && res.data.items) {
          setCartCount(res.data.items.length);
        }
      } catch (err) {
        console.error('Failed to load cart items count', err);
      }
    };

    fetchCartCount();
    const interval = setInterval(fetchCartCount, 7000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'COLLEGE_ADMIN': return 'College Admin';
      case 'VENDOR': return 'Vendor';
      case 'STAFF': return 'Staff';
      case 'USER': return 'User';
      default: return '';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return <Shield className="h-5 w-5 text-red-400" />;
      case 'COLLEGE_ADMIN': return <Building className="h-5 w-5 text-indigo-400" />;
      case 'VENDOR': return <Store className="h-5 w-5 text-emerald-400" />;
      case 'STAFF': return <ChefHat className="h-5 w-5 text-amber-400" />;
      default: return <Users className="h-5 w-5 text-purple-400" />;
    }
  };

  const getNavigationLinks = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { name: 'Dashboard', path: ROUTES.SUPER_ADMIN_DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
          { name: 'Platform Analytics', path: ROUTES.SUPER_ADMIN_ANALYTICS, icon: <BarChart2 className="h-5 w-5" /> },
          { name: 'Messages', path: ROUTES.MESSAGES, icon: <MessageSquare className="h-5 w-5" /> },
        ];
      case 'COLLEGE_ADMIN':
        return [
          { name: 'Dashboard', path: ROUTES.COLLEGE_ADMIN_DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
          { name: 'Restaurant Analytics', path: ROUTES.COLLEGE_ADMIN_ANALYTICS, icon: <BarChart2 className="h-5 w-5" /> },
          { name: 'Messages', path: ROUTES.MESSAGES, icon: <MessageSquare className="h-5 w-5" /> },
        ];
      case 'VENDOR':
        return [
          { name: 'Dashboard', path: ROUTES.VENDOR_DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
          { name: 'Orders', path: ROUTES.ORDERS, icon: <ClipboardList className="h-5 w-5" /> },
          { name: 'QR Scanner', path: ROUTES.QR_SCANNER, icon: <QrCode className="h-5 w-5" /> },
          { name: 'My Shop', path: ROUTES.MY_SHOP, icon: <Store className="h-5 w-5" /> },
          { name: 'Menu Management', path: ROUTES.MENU_MANAGEMENT, icon: <ChefHat className="h-5 w-5" /> },
          { name: 'Messages', path: ROUTES.MESSAGES, icon: <MessageSquare className="h-5 w-5" /> },
        ];
      case 'STAFF':
        return [
          { name: 'Dashboard', path: ROUTES.STAFF_DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
          { name: 'Orders', path: ROUTES.ORDERS, icon: <ClipboardList className="h-5 w-5" /> },
          { name: 'QR Scanner', path: ROUTES.QR_SCANNER, icon: <QrCode className="h-5 w-5" /> },
          { name: 'Messages', path: ROUTES.MESSAGES, icon: <MessageSquare className="h-5 w-5" /> },
        ];
      case 'USER':
        return [
          { name: 'Dashboard', path: ROUTES.USER_DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
          { name: 'Browse Food', path: ROUTES.BROWSE_FOOD, icon: <ShoppingBag className="h-5 w-5" /> },
          { name: 'Cart', path: ROUTES.CART, icon: <ShoppingCart className="h-5 w-5" /> },
          { name: 'My Orders', path: ROUTES.ORDERS, icon: <ClipboardList className="h-5 w-5" /> },
          { name: 'Notifications', path: ROUTES.NOTIFICATIONS, icon: <Bell className="h-5 w-5" /> },
          { name: 'Profile', path: ROUTES.PROFILE, icon: <UserIcon className="h-5 w-5" /> },
        ];
      default:
        return [];
    }
  };

  const links = getNavigationLinks(user?.role);

  return (
    <div className="min-h-screen flex bg-[#0c0a14]">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-white/5 bg-[#0f0d1a]
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:flex lg:flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-purple-500/20">
              CB
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 text-glow">
              CampusBite
            </span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white cursor-pointer" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 mx-4 my-6 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            {getRoleIcon(user?.role)}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-medium text-sm text-gray-200 truncate">{user?.email}</h4>
            <span className="text-xs text-purple-400 font-semibold">{getRoleLabel(user?.role)}</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.name}
                onClick={() => {
                  navigate(link.path);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-200 border-l-2 border-purple-500 shadow-inner' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                {link.icon}
                <span>{link.name}</span>
                {link.name === 'Messages' && unreadCount > 0 && (
                  <span className="ml-auto bg-purple-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full min-w-5 text-center leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {link.name === 'Cart' && cartCount > 0 && (
                  <span className="ml-auto bg-purple-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full min-w-5 text-center leading-none">
                    {cartCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-[#0c0a14]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white focus:outline-none cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-100 capitalize">
              {location.pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide uppercase">
                Active Session
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
