import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderingService from '../services/ordering';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import RestaurantCard from '../components/common/RestaurantCard';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Search, MapPin, Building, GraduationCap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const BrowseFood = () => {
  const navigate = useNavigate();

  // Selections
  const [colleges, setColleges] = useState([]);
  const [areas, setAreas] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  // Selected values
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [searchVal, setSearchVal] = useState('');

  // Loaders
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  const fetchColleges = async () => {
    setLoadingColleges(true);
    try {
      const res = await orderingService.getColleges();
      if (res && res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setColleges(list);
        // Pre-select first if available
        if (list.length > 0) {
          setSelectedCollege(String(list[0].id));
        }
      }
    } catch (err) {
      toast.error('Failed to load colleges.');
    } finally {
      setLoadingColleges(false);
    }
  };

  const fetchAreas = async (collegeId) => {
    setLoadingAreas(true);
    try {
      const res = await orderingService.getAreas(collegeId);
      if (res && res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setAreas(list);
        setSelectedArea('');
        setSelectedBlock('');
        setRestaurants([]);
      }
    } catch (err) {
      toast.error('Failed to load areas.');
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchBlocks = async (collegeId, areaName) => {
    setLoadingBlocks(true);
    try {
      const res = await orderingService.getBlocks(collegeId, areaName);
      if (res && res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setBlocks(list);
        setSelectedBlock('');
        setRestaurants([]);
      }
    } catch (err) {
      toast.error('Failed to load blocks.');
    } finally {
      setLoadingBlocks(false);
    }
  };

  const fetchRestaurants = async (collegeId, areaName, blockName) => {
    setLoadingRestaurants(true);
    try {
      const res = await orderingService.getRestaurants(collegeId, areaName, blockName);
      if (res && res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setRestaurants(list);
      }
    } catch (err) {
      toast.error('Failed to load restaurants.');
    } finally {
      setLoadingRestaurants(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      fetchAreas(selectedCollege);
    }
  }, [selectedCollege]);

  useEffect(() => {
    if (selectedCollege && selectedArea) {
      fetchBlocks(selectedCollege, selectedArea);
    }
  }, [selectedArea]);

  useEffect(() => {
    if (selectedCollege && selectedArea && selectedBlock) {
      fetchRestaurants(selectedCollege, selectedArea, selectedBlock);
    }
  }, [selectedBlock]);

  const filteredRestaurants = restaurants.filter(r => 
    r.restaurant_name.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Browse Food Court" 
        description="Search canteens, browse menus, and pick up your order without queues."
      />

      {/* Selectors and filters */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121020]/60 backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {/* Step 1: College Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-purple-400" />
            1. Select College
          </label>
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            disabled={loadingColleges}
            className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#0a0815] text-gray-200 text-xs focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="" disabled>Select College</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Step 2: Area Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-purple-400" />
            2. Select Area
          </label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            disabled={!selectedCollege || loadingAreas}
            className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#0a0815] text-gray-200 text-xs focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-30"
          >
            <option value="">Select Area</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Step 3: Block Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Building className="h-4 w-4 text-purple-400" />
            3. Select Block
          </label>
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            disabled={!selectedArea || loadingBlocks}
            className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#0a0815] text-gray-200 text-xs focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-30"
          >
            <option value="">Select Block</option>
            {blocks.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and results list */}
      {selectedBlock && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search restaurant by name..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-9 pr-4 py-3 text-xs rounded-xl border border-white/5 bg-[#121020]/60 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
              Available stalls: <span className="text-purple-400 font-black">{filteredRestaurants.length}</span>
            </div>
          </div>

          {loadingRestaurants ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 rounded-3xl border border-white/5 bg-white/[0.01] p-6 space-y-4 animate-pulse">
                  <div className="h-32 bg-white/5 rounded-2xl w-full" />
                  <div className="h-4 bg-white/5 rounded w-1/3" />
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <EmptyState 
              message="No restaurants found." 
              actionLabel="Reset Search"
              onActionClick={() => setSearchVal('')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {filteredRestaurants.map((r) => (
                <RestaurantCard 
                  key={r.id} 
                  restaurant={r} 
                  onViewMenu={(id) => navigate(ROUTES.RESTAURANT_DETAILS.replace(':id', id))}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedBlock && (
        <div className="py-16 text-center space-y-3">
          <div className="p-4 bg-white/5 border border-white/5 rounded-3xl text-gray-500 inline-block shadow-xl">
            <Building className="h-10 w-10 text-purple-400" />
          </div>
          <h4 className="text-base font-bold text-gray-200">Start Exploring Canteens</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Please pick a college, area, and block from the dropdowns above to list available food court stalls.
          </p>
        </div>
      )}
    </div>
  );
};

export default BrowseFood;
