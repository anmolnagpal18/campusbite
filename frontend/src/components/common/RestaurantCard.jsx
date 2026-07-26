import React from 'react';
import Card from './Card';
import Button from './Button';
import { Clock, MapPin, Store, Star, Flame } from 'lucide-react';

export const RestaurantCard = ({ restaurant, onViewMenu }) => {
  const {
    id,
    restaurant_name,
    shop_area,
    block,
    opening_time,
    closing_time,
    is_currently_open,
    category_count,
    food_items_count,
    rating
  } = restaurant;

  // Use a modern, beautiful food background pattern or default food image
  const defaultBanner = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:scale-[1.01] transition-transform duration-200 border border-white/5 bg-[#121020]/60 backdrop-blur-md">
      {/* Banner */}
      <div className="relative h-40 w-full overflow-hidden">
        <img 
          src={defaultBanner} 
          alt={restaurant_name} 
          className="w-full h-full object-cover filter brightness-[0.8]"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${is_currently_open ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {is_currently_open ? 'Open Now' : 'Closed Now'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-gray-100 truncate">{restaurant_name}</h3>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
              <Star className="h-3 w-3 fill-amber-400" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{shop_area} • {block}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span>{opening_time || '09:00'} - {closing_time || '21:00'}</span>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold">
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-purple-400" />
              {category_count} categories
            </span>
            <span>•</span>
            <span>{food_items_count} items</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onViewMenu(id)}
            disabled={!is_currently_open}
          >
            View Menu
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RestaurantCard;
