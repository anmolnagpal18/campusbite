export const MenuCard = ({ item, onClick }) => {
  // Placeholder logic for dietary tags
  const tags = [];
  if (item.is_vegetarian) tags.push('Veg');
  if (item.is_vegan) tags.push('Vegan');
  if (item.is_jain) tags.push('Jain');
  if (item.contains_egg) tags.push('Contains Egg');

  return (
    <div onClick={onClick} className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer flex flex-col h-full">
      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          {!item.is_available && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">Out of Stock</span>}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">{item.name}</h3>
          <span className="font-bold text-lg text-slate-900 dark:text-white">₹{item.price}</span>
        </div>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-1 mb-4">
          {item.description || 'No description available.'}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
