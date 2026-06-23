import React, { useState, useEffect } from 'react';
import { SPECIALTY_FLAVORS } from '../data';
import { SodaSpotting, StockLevel, SodaFlavor } from '../types';
import { MapPin, Plus, Sparkles, Star, DollarSign, X } from 'lucide-react';

interface ReportFormProps {
  mapSelectedCoords: { latitude: number; longitude: number; address: string } | null;
  onSubmit: (newSpot: Omit<SodaSpotting, 'id' | 'reportedTime' | 'confirmations' | 'denials' | 'comments'>) => void;
  onCancel: () => void;
  onTriggerMapPick: () => void;
  reportingMode: boolean;
  availableFlavors?: SodaFlavor[];
  currentUserDisplayName?: string | null;
}

export default function ReportForm({
  mapSelectedCoords,
  onSubmit,
  onCancel,
  onTriggerMapPick,
  reportingMode,
  availableFlavors = SPECIALTY_FLAVORS,
  currentUserDisplayName = null,
}: ReportFormProps) {
  // Form States
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(availableFlavors[0]?.id || SPECIALTY_FLAVORS[0].id);
  const [customFlavorName, setCustomFlavorName] = useState<string>('');
  const [customFlavorBrand, setCustomFlavorBrand] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<SodaSpotting['category']>('Soda');
  const [isCustomFlavor, setIsCustomFlavor] = useState<boolean>(false);

  const [storeName, setStoreName] = useState<string>('');
  const [storeAddress, setStoreAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(33.749);
  const [longitude, setLongitude] = useState<number>(-84.388);

  const [stockLevel, setStockLevel] = useState<StockLevel>('Medium');
  const [price, setPrice] = useState<string>('');
  const [sizeOption, setSizeOption] = useState<string>('12 oz Can');
  const [customSize, setCustomSize] = useState<string>('');
  const [reportedBy, setReportedBy] = useState<string>('');
  const [storeRating, setStoreRating] = useState<number>(4);

  // Sync with user authentication name
  useEffect(() => {
    if (currentUserDisplayName && !reportedBy) {
      setReportedBy(currentUserDisplayName);
    }
  }, [currentUserDisplayName]);

  // Sync with coordinates from map clicks
  useEffect(() => {
    if (mapSelectedCoords) {
      setLatitude(mapSelectedCoords.latitude);
      setLongitude(mapSelectedCoords.longitude);
      setStoreAddress(mapSelectedCoords.address);
    }
  }, [mapSelectedCoords]);

  // Adjust default selected unit when availableFlavors list changes
  useEffect(() => {
    if (availableFlavors && availableFlavors.length > 0) {
      setSelectedFlavorId(availableFlavors[0].id);
    }
  }, [availableFlavors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName.trim() || !storeAddress.trim()) {
      alert('Please fill out the Store Name and Location Address.');
      return;
    }

    let finalFlavorName = '';
    let finalBrand = '';
    let finalCategory: SodaSpotting['category'] = 'Soda';

    if (isCustomFlavor) {
      if (!customFlavorName.trim()) {
        alert('Please specify the beverage flavor name.');
        return;
      }
      finalFlavorName = customFlavorName;
      finalBrand = customFlavorBrand.trim() || 'Custom Soda Co.';
      finalCategory = customCategory;
    } else {
      const match = availableFlavors.find((f) => f.id === selectedFlavorId);
      if (match) {
        finalFlavorName = match.name;
        finalBrand = match.brand;
        finalCategory = match.category as any || 'Soda';
      }
    }

    onSubmit({
      flavorId: isCustomFlavor ? `custom-${Date.now()}` : selectedFlavorId,
      flavorName: finalFlavorName,
      brand: finalBrand,
      category: finalCategory,
      storeName,
      storeAddress,
      latitude,
      longitude,
      stockLevel,
      price: price ? parseFloat(price) : undefined,
      size: sizeOption === 'Custom' ? (customSize.trim() || 'Custom Size') : sizeOption,
      reportedBy: reportedBy.trim() || 'AnonymousFinder',
      reportedByReputation: 120, // baseline
      storeRating,
    });
  };

  const stockOptions: { level: StockLevel; desc: string; color: string; border: string; bg: string }[] = [
    { level: 'Full Shelf', desc: 'Packed stack', color: 'text-emerald-700 bg-emerald-100', border: 'border-emerald-300', bg: 'bg-emerald-50' },
    { level: 'High', desc: 'Ample supply', color: 'text-teal-700 bg-teal-100', border: 'border-teal-300', bg: 'bg-teal-50' },
    { level: 'Medium', desc: 'Fair amount', color: 'text-amber-700 bg-amber-100', border: 'border-amber-300', bg: 'bg-amber-50' },
    { level: 'Low', desc: 'A few left', color: 'text-orange-700 bg-orange-100', border: 'border-orange-300', bg: 'bg-orange-50' },
    { level: 'Out of Stock', desc: 'Empty row', color: 'text-rose-700 bg-rose-100', border: 'border-rose-300', bg: 'bg-rose-50' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-150 pb-3">
        <div>
          <h3 className="font-sans font-bold text-slate-900 text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500 fill-emerald-100" />
            Spot a Hard-to-Find Flavor
          </h3>
          <p className="text-xs text-slate-500 mt-0.2">Share your fizzy discovery with other seekers</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 1. Beverage Selector */}
      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>WHAT DRINK DID YOU FIND?</span>
          <button
            type="button"
            onClick={() => setIsCustomFlavor(!isCustomFlavor)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors font-medium cursor-pointer"
          >
            {isCustomFlavor ? 'Select pre-listed flavors' : 'Add custom/unlisted drink'}
          </button>
        </div>

        {!isCustomFlavor ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-mono">Select Flavor</label>
            <select
              value={selectedFlavorId}
              onChange={(e) => setSelectedFlavorId(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {availableFlavors.map((flavor) => (
                <option key={flavor.id} value={flavor.id}>
                  [{flavor.brand.substring(0, 10)}] {flavor.name} (Rarity: {flavor.rarityScore ?? 8}/10)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Flavor / Drink Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mello Yello Zero Peach"
                  required={isCustomFlavor}
                  value={customFlavorName}
                  onChange={(e) => setCustomFlavorName(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand / Bottler</label>
                <input
                  type="text"
                  placeholder="e.g. Coca-Cola Co."
                  value={customFlavorBrand}
                  onChange={(e) => setCustomFlavorBrand(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <div className="flex gap-2">
                {(['Soda', 'Energy Drink', 'Tea/Juice', 'Rare Import', 'Seltzer'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCustomCategory(cat)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      customCategory === cat
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Retailer Location */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-500 font-mono tracking-wider">RETAILER & STORE DETAILS</label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name *</label>
            <input
              type="text"
              placeholder="e.g. Midtown Target, Chevron Circle"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Store Address / Location *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 102 Peachtree St, Midtown"
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <MapPin className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Dynamic map-click helper */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${mapSelectedCoords ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`} />
            <p className="text-slate-600 font-sans">
              {mapSelectedCoords ? (
                <span>📍 <span className="font-semibold text-emerald-800">Custom location pinpointed!</span> Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
              ) : (
                <span>💡 You can click/tap directly on the map to pinpoint this retail shelf precisely!</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onTriggerMapPick}
            className={`px-2.5 py-1 text-[11px] rounded-md font-semibold font-sans transition-all cursor-pointer ${
              reportingMode
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {reportingMode ? 'Pin Active...' : 'Pin on Map'}
          </button>
        </div>
      </div>

      {/* 3. Availability level (Low, Medium, High, Full Shelf, Out of Stock) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 font-mono tracking-wider">SHELF AVAILABILITY LEVEL</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {stockOptions.map((opt) => (
            <button
              key={opt.level}
              type="button"
              onClick={() => setStockLevel(opt.level)}
              className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                stockLevel === opt.level
                  ? `${opt.border} ${opt.bg} ring-2 ring-indigo-500 shadow-xs scale-102`
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${opt.color}`}>
                {opt.level.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Beverage Size Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 font-mono tracking-wider">BEVERAGE CONTAINER SIZE</label>
        <div className="flex flex-wrap gap-1.5">
          {['12 oz Can', '16 oz Can', '20 oz Bottle', '12-Pack (12 oz Cans)', '16.9 oz Bottle', '2 Liters', 'Custom'].map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setSizeOption(sz)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                sizeOption === sz
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>

        {sizeOption === 'Custom' && (
          <div className="pt-2 animate-fade-in">
            <label className="block text-[10px] font-bold text-slate-500 font-mono mb-1">SPECIFY CUSTOM SIZE</label>
            <input
              type="text"
              placeholder="e.g. 6-Pack (7.5 oz Mini-Cans), 32 oz Fountain, 24 oz Can"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              required={sizeOption === 'Custom'}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* 4. Secondary info (Price, Username, Store Star Rating) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Your Finder Nickname</label>
          <input
            type="text"
            placeholder="e.g. FizzBuster9"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
            Price per unit (optional)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 6.49"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Store Specialty Rating</label>
          <div className="flex items-center gap-1.5 py-1.5 h-9">
            {[1, 2, 3, 4, 5].map((stars) => (
              <button
                key={stars}
                type="button"
                onClick={() => setStoreRating(stars)}
                className="text-amber-400 hover:scale-110 active:scale-90 transition-transform cursor-pointer"
                title={`${stars} Stars`}
              >
                <Star className={`h-5 w-5 ${stars <= storeRating ? 'fill-amber-400' : 'text-slate-300'}`} />
              </button>
            ))}
            <span className="text-xs text-slate-500 font-bold ml-1">{storeRating}/5</span>
          </div>
        </div>
      </div>

      {/* 5. Submit Panel */}
      <div className="flex gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
        >
          Submit Spotting
        </button>
      </div>
    </form>
  );
}
