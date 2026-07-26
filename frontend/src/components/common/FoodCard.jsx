import React from 'react';
import Card from './Card';
import Button from './Button';
import { Plus, Minus, AlertTriangle } from 'lucide-react';

export const FoodCard = ({ item, cartQuantity, onAdd, onUpdateQuantity, onRemove }) => {
  const {
    id,
    item_name,
    description,
    price,
    quantity: stock,
    availability,
    food_image,
    food_thumbnail
  } = item;

  const isOutOfStock = availability === 'UNAVAILABLE' || stock <= 0;
  const imageSrc = food_thumbnail || food_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';

  return (
    <Card className="flex gap-4 p-4 border border-white/5 bg-[#121020]/60 backdrop-blur-md items-center justify-between">
      <div className="flex gap-4 items-center min-w-0 flex-1">
        {/* Image */}
        <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0 border border-white/5">
          <img 
            src={imageSrc} 
            alt={item_name} 
            className={`w-full h-full object-cover ${isOutOfStock ? 'filter grayscale brightness-[0.5]' : ''}`}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-[9px] font-black text-red-400 bg-red-950/80 border border-red-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Out of stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-gray-200 truncate">{item_name}</h4>
          <p className="text-xs text-gray-400 truncate mt-0.5 leading-relaxed">{description || 'No description available.'}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-extrabold text-purple-400">₹{parseFloat(price).toFixed(2)}</span>
            {stock > 0 && stock <= 5 && !isOutOfStock && (
              <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 border border-amber-500/20">
                <AlertTriangle className="h-2.5 w-2.5" />
                Only {stock} left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cart Actions */}
      <div className="shrink-0 flex items-center">
        {isOutOfStock ? (
          <Button variant="outline" size="sm" disabled>
            Unavailable
          </Button>
        ) : cartQuantity > 0 ? (
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl p-1">
            <button
              onClick={() => onUpdateQuantity(cartQuantity - 1)}
              className="p-1.5 text-purple-400 hover:text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-black text-gray-100">{cartQuantity}</span>
            <button
              onClick={() => onUpdateQuantity(cartQuantity + 1)}
              disabled={cartQuantity >= stock}
              className="p-1.5 text-purple-400 hover:text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={onAdd}>
            Add to Cart
          </Button>
        )}
      </div>
    </Card>
  );
};

export default FoodCard;
