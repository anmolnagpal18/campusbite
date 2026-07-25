import React from 'react';
import Card from '../common/Card';
import { ChefHat, Image as ImageIcon } from 'lucide-react';

export const MenuPreview = ({ categories = [], items = [], restaurant }) => {
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat.id] = items.filter(item => item.category === cat.id);
    return acc;
  }, {});

  const activeCategories = categories.filter(c => c.status === 'ACTIVE');

  return (
    <Card className="h-[75vh] flex flex-col justify-between overflow-hidden relative hover:translate-y-0">
      <div className="border-b border-white/5 pb-3 mb-4">
        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-purple-400" />
          Live Menu Preview
        </h3>
        <p className="text-[10px] text-gray-400">Instantly previews how customers will view your menu.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {restaurant && (
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 mb-4">
            <h4 className="text-sm font-bold text-purple-300">{restaurant.restaurant_name}</h4>
            <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
              <span>{restaurant.shop_area} • Block {restaurant.block}</span>
              <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${restaurant.is_currently_open ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {restaurant.is_currently_open ? 'Open Now' : 'Closed Now'}
              </span>
            </div>
          </div>
        )}

        {activeCategories.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-gray-500 text-xs gap-2">
            <ChefHat className="h-10 w-10 text-gray-600 animate-pulse" />
            <p>No active categories to preview yet.</p>
          </div>
        ) : (
          activeCategories.map(cat => {
            const catItems = groupedItems[cat.id] || [];
            return (
              <div key={cat.id} className="space-y-3">
                <h5 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest border-l-2 border-purple-500 pl-2">
                  {cat.category_name}
                </h5>

                {catItems.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic pl-2">No items in this category yet.</p>
                ) : (
                  <div className="space-y-2">
                    {catItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-xl border flex gap-3 transition-colors ${item.availability === 'AVAILABLE' ? 'bg-white/[0.01] border-white/5 hover:border-purple-500/20' : 'bg-black/20 border-white/5 opacity-60'}`}
                      >
                        <div className="h-14 w-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {item.food_image ? (
                            <img src={item.food_image} alt={item.item_name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h6 className="text-xs font-bold text-gray-200 truncate">{item.item_name}</h6>
                              <span className="text-xs font-extrabold text-purple-400 shrink-0">
                                ${parseFloat(item.price).toFixed(2)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[9px]">
                            <span className="text-gray-500">Qty: {item.quantity}</span>
                            <span className={item.availability === 'AVAILABLE' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                              {item.availability === 'AVAILABLE' ? 'Available' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default MenuPreview;
