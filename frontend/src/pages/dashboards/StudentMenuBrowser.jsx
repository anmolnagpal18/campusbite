import { useState, useEffect } from 'react';
import axiosClient from '../../config/axios';
import { MenuCard } from '../../components/MenuCard';
import { CategoryCard } from '../../components/CategoryCard';
import { FilterSidebar } from '../../components/FilterSidebar';
import { SearchBox } from '../../components/SearchBox';
import { Loader } from '../../components/Loader';
import { EmptyState } from '../../components/EmptyState';
import toast from 'react-hot-toast';

const StudentMenuBrowser = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    // Initial load: Fetch available approved vendors
    const fetchInitialData = async () => {
      try {
        const response = await axiosClient.get('/vendors/?status=APPROVED&is_active=true');
        setVendors(response.data.results || response.data);
      } catch (err) {
        toast.error("Failed to load vendors");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleVendorSelect = async (vendor) => {
    setSelectedVendor(vendor);
    setSelectedCategory(null);
    setLoading(true);
    try {
      const catResponse = await axiosClient.get(`/categories/?vendor=${vendor.id}&is_active=true`);
      setCategories(catResponse.data.results || catResponse.data);
      fetchMenuItems(vendor.id, null);
    } catch (err) {
      toast.error("Failed to load vendor catalog");
    }
  };

  const fetchMenuItems = async (vendorId, categoryId) => {
    setLoading(true);
    try {
      let url = `/menu-items/?vendor=${vendorId}&is_available=true`;
      if (categoryId) url += `&category=${categoryId}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      
      // Apply strict filters
      if (filters.is_vegetarian) url += '&is_vegetarian=true';
      if (filters.is_vegan) url += '&is_vegan=true';
      if (filters.is_jain) url += '&is_jain=true';
      if (filters.is_spicy) url += '&is_spicy=true';

      const response = await axiosClient.get(url);
      setMenuItems(response.data.results || response.data);
    } catch (err) {
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  // React to search or filter changes if a vendor is selected
  useEffect(() => {
    if (selectedVendor) {
      fetchMenuItems(selectedVendor.id, selectedCategory?.id);
    }
  }, [searchQuery, filters, selectedCategory]);

  if (!selectedVendor) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-600 text-white p-8 rounded-xl shadow-md">
          <h1 className="text-3xl font-bold mb-2">Feeling Hungry?</h1>
          <p className="text-blue-100">Browse available food vendors on campus and discover your next meal.</p>
        </div>
        
        {loading ? <Loader /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map(v => (
              <div 
                key={v.id} 
                onClick={() => handleVendorSelect(v)}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {v.logo ? <img src={v.logo} alt={v.vendor_name} className="w-full h-full object-cover"/> : <span className="text-xl font-bold text-slate-400">{v.vendor_name.charAt(0)}</span>}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{v.vendor_name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Open Now</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => setSelectedVendor(null)} className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Vendors
        </button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {selectedVendor.vendor_name} Menu
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Filters & Categories */}
        <div className="w-full lg:w-1/4 space-y-6">
          <FilterSidebar onFilterChange={setFilters} />
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hidden lg:block">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Categories</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${!selectedCategory ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                All Items
              </button>
              {categories.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setSelectedCategory(c)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${selectedCategory?.id === c.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Search & Grid */}
        <div className="w-full lg:w-3/4 space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white hidden sm:block">
              {selectedCategory ? selectedCategory.name : 'All Items'}
            </h3>
            <div className="w-full sm:w-auto">
              <SearchBox onSearch={setSearchQuery} placeholder="Search dishes, ingredients..." />
            </div>
          </div>

          {loading ? (
            <Loader />
          ) : menuItems.length === 0 ? (
            <EmptyState 
              title="No items found" 
              message="Try adjusting your filters or search query."
              actionLabel="Clear Filters"
              onAction={() => { setFilters({}); setSearchQuery(''); }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {menuItems.map(item => (
                <MenuCard 
                  key={item.id} 
                  item={item} 
                  onClick={() => { /* Open Details Modal */ }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMenuBrowser;
