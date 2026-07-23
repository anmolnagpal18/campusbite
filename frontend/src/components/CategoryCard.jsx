export const CategoryCard = ({ category, onClick }) => (
  <div onClick={onClick} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-blue-500 transition-colors flex items-center gap-4">
    <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
      {category.image ? (
        <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400">
          <span className="font-bold text-xl">{category.name.charAt(0)}</span>
        </div>
      )}
    </div>
    <div>
      <h4 className="font-bold text-slate-900 dark:text-white">{category.name}</h4>
      {category.description && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{category.description}</p>}
    </div>
  </div>
);
