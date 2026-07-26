import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderingService from '../services/ordering';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import FoodCard from '../components/common/FoodCard';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { Search, MapPin, Clock, ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Cart conflict modal
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingFoodItem, setPendingFoodItem] = useState(null);

  const fetchRestaurantAndCart = async () => {
    setLoading(true);
    try {
      const restRes = await orderingService.getRestaurantDetail(id);
      if (restRes && restRes.success) {
        setRestaurant(restRes.data);
        if (restRes.data.categories && restRes.data.categories.length > 0) {
          setSelectedCategory(restRes.data.categories[0].id);
        }
      }

      const cartRes = await orderingService.getCart();
      if (cartRes && cartRes.success) {
        setCart(cartRes.data);
      }
    } catch (err) {
      toast.error('Failed to load restaurant details.');
      navigate(ROUTES.BROWSE_FOOD);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantAndCart();
  }, [id]);

  const handleAddToCart = async (foodItem) => {
    setActionLoading(true);
    try {
      const res = await orderingService.addToCart(foodItem.id, 1);
      if (res && res.success) {
        setCart(res.data);
        toast.success(`Added ${foodItem.item_name} to cart.`);
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData && errorData.code === 'RESTAURANT_CONFLICT') {
        setPendingFoodItem(foodItem);
        setShowConflictModal(true);
      } else {
        toast.error(errorData?.detail || 'Failed to add item to cart.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQty) => {
    setActionLoading(true);
    try {
      const res = await orderingService.updateCartItem(cartItemId, newQty);
      if (res && res.success) {
        setCart(res.data);
        toast.success('Cart updated.');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update cart.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAndAdd = async () => {
    if (!pendingFoodItem) return;
    setActionLoading(true);
    try {
      // Clear Cart
      await orderingService.clearCart();
      // Add the new item
      const res = await orderingService.addToCart(pendingFoodItem.id, 1);
      if (res && res.success) {
        setCart(res.data);
        toast.success(`Cleared old cart and added ${pendingFoodItem.item_name}.`);
      }
      setShowConflictModal(false);
      setPendingFoodItem(null);
    } catch (err) {
      toast.error('Failed to clear cart and add item.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!restaurant) return null;

  // Find active cart quantity for a food item
  const getCartQuantityAndId = (foodItemId) => {
    if (!cart || !cart.items) return { qty: 0, cartItemId: null };
    const match = cart.items.find(i => i.food_item === foodItemId);
    return match ? { qty: match.quantity, cartItemId: match.id } : { qty: 0, cartItemId: null };
  };

  return (
    <div className="space-y-8">
      {/* Header Back Button */}
      <button
        onClick={() => navigate(ROUTES.BROWSE_FOOD)}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to browse
      </button>

      {/* Restaurant Profile Banner */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121020]/60 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-gray-100 tracking-tight">{restaurant.restaurant_name}</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-purple-400" />
              {restaurant.shop_area} • {restaurant.block}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              {restaurant.opening_time} - {restaurant.closing_time}
            </span>
          </div>
        </div>

        {cart && cart.items && cart.items.length > 0 && (
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.CART)}
            icon={<ShoppingCart className="h-4 w-4" />}
          >
            View Cart ({cart.items.length})
          </Button>
        )}
      </div>

      {/* Menu layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Menu Categories</h3>
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:overflow-x-visible">
            {restaurant.categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap text-left transition-all shrink-0 cursor-pointer ${
                    isActive 
                      ? 'bg-purple-600 border border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.2)]'
                      : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.category_name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Food Items List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search dishes inside menu..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-4 py-3 text-xs rounded-xl border border-white/5 bg-[#121020]/60 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-4">
            {restaurant.categories
              .filter(cat => cat.id === selectedCategory)
              .map(cat => {
                const items = cat.items.filter(item => 
                  item.item_name.toLowerCase().includes(searchVal.toLowerCase())
                );
                
                if (items.length === 0) {
                  return (
                    <div key={cat.id} className="text-center py-12 text-xs text-gray-500">
                      No items found in this category.
                    </div>
                  );
                }

                return (
                  <div key={cat.id} className="space-y-4 animate-fade-in">
                    {items.map(item => {
                      const { qty, cartItemId } = getCartQuantityAndId(item.id);
                      return (
                        <FoodCard
                          key={item.id}
                          item={item}
                          cartQuantity={qty}
                          onAdd={() => handleAddToCart(item)}
                          onUpdateQuantity={(newQty) => handleUpdateQuantity(cartItemId, newQty)}
                        />
                      );
                    })}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Cart Conflict Dialog */}
      {showConflictModal && (
        <Modal
          isOpen={showConflictModal}
          onClose={() => {
            setShowConflictModal(false);
            setPendingFoodItem(null);
          }}
          title="Replace Cart Items?"
        >
          <div className="space-y-6">
            <p className="text-xs text-gray-400 leading-relaxed">
              Your cart already contains items from another restaurant. Would you like to clear your current cart and start a new order with <span className="text-purple-400 font-bold">{restaurant.restaurant_name}</span>?
            </p>
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingFoodItem(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleClearAndAdd}
                loading={actionLoading}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Clear Cart & Add
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RestaurantDetails;
