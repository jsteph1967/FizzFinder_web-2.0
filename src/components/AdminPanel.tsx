import React, { useState } from 'react';
import { 
  Shield, 
  Trash2, 
  Flag, 
  Award, 
  Plus, 
  Volume2, 
  Check, 
  Sparkles, 
  FolderPlus,
  RefreshCw
} from 'lucide-react';
import { SodaSpotting, SodaFlavor, StockLevel } from '../types';
import { SPECIALTY_FLAVORS } from '../data';

interface AdminPanelProps {
  isAdminActive: boolean;
  setIsAdminActive: (v: boolean) => void;
  spottings: SodaSpotting[];
  onUpdateSpottings: (updated: SodaSpotting[]) => void;
  onAddCustomFlavor: (newFlavor: SodaFlavor) => void;
  customFlavors: SodaFlavor[];
  onTriggerAlert: (title: string, body: string) => void;
}

export default function AdminPanel({
  isAdminActive,
  setIsAdminActive,
  spottings,
  onUpdateSpottings,
  onAddCustomFlavor,
  customFlavors,
  onTriggerAlert
}: AdminPanelProps) {
  // New flavor form state
  const [newFlavorName, setNewFlavorName] = useState('');
  const [newFlavorBrand, setNewFlavorBrand] = useState('');
  const [newFlavorRarity, setNewFlavorRarity] = useState<'All-Time Rare' | 'Limited Edition' | 'Regional Craft' | 'Discontinued'>('All-Time Rare');
  const [newFlavorCategory, setNewFlavorCategory] = useState<'Zero Sugar' | 'Classic Cola' | 'Fruit Punch' | 'Energy' | 'Specialty'>('Specialty');
  const [flavorDescription, setFlavorDescription] = useState('');

  // Global flash alert state
  const [alertTitle, setAlertTitle] = useState('🚨 URGENT FLAVOR ALERT');
  const [alertBody, setAlertBody] = useState('New shipment of Mello Yello Zero spotted in Midtown Atlanta! Supplies limited.');

  const handleCreateFlavor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlavorName || !newFlavorBrand) return;

    const id = newFlavorName.toLowerCase().replace(/\s+/g, '-');
    const newFlavor: SodaFlavor = {
      id,
      name: newFlavorName,
      brand: newFlavorBrand,
      rarityScore: newFlavorRarity,
      category: newFlavorCategory,
      description: flavorDescription || `A rare variety representing ${newFlavorBrand}'s specialty recipes.`
    };

    onAddCustomFlavor(newFlavor);
    setNewFlavorName('');
    setNewFlavorBrand('');
    setFlavorDescription('');
    alert(`Success! "${newFlavorName}" is now a globally recognized rare beverage category in the finder checklist!`);
  };

  const handleMarkAsSuperRare = (spottingId: string) => {
    const updated = spottings.map(s => {
      if (s.id === spottingId) {
        return {
          ...s,
          isPremiumOnly: true, // make super rare
          confirmations: s.confirmations + 10, // boost rating
          reportedByReputation: s.reportedByReputation + 100 // reward the user lister 
        };
      }
      return s;
    });
    onUpdateSpottings(updated);
    alert(`Item promoted! This spotting is now highlighted with golden outer badges to reflect verified exceptional rarity, rewarding the reporter!`);
  };

  const handleFlagReport = (spottingId: string) => {
    const updated = spottings.map(s => {
      if (s.id === spottingId) {
        return {
          ...s,
          denials: s.denials + 5,
          stockLevel: 'Low' as StockLevel
        };
      }
      return s;
    });
    onUpdateSpottings(updated);
    alert(`Report flagged as questionable. Upgraded consumer warning and marked stock level as extremely Low.`);
  };

  const handleDeleteReport = (spottingId: string) => {
    if (confirm('Are you absolutely sure you want to delete this crowdsourced spotting record? This cannot be undone.')) {
      const filtered = spottings.filter(s => s.id !== spottingId);
      onUpdateSpottings(filtered);
    }
  };

  const handlePushGlobalAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle || !alertBody) return;
    onTriggerAlert(alertTitle, alertBody);
    alert(`Broadcast dispatched successfully to active consumer applet users!`);
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 border-2 border-slate-800 shadow-xl font-sans">
      
      {/* Admin Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-rose-600 rounded-xl flex items-center justify-center animate-pulse">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-200 font-mono">
              Moderator Suite
            </h3>
            <p className="text-[11px] text-slate-400">Manage GIS crowdsourced records & specialty list</p>
          </div>
        </div>

        {/* Real Mode Switch */}
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={isAdminActive} 
            onChange={(e) => setIsAdminActive(e.target.checked)}
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          <span className="ml-2.5 text-xs font-bold font-mono text-slate-300">
            {isAdminActive ? 'ADMIN LIVE' : 'ADMIN INACTIVE'}
          </span>
        </label>
      </div>

      {!isAdminActive ? (
        <div className="p-4 text-center text-slate-400 space-y-3 font-sans">
          <Shield className="h-10 w-10 mx-auto text-slate-600" />
          <h4 className="font-bold text-slate-200 text-sm">Console Lock Active</h4>
          <p className="text-[11px] max-w-sm mx-auto">
            Toggle the <strong className="text-white">"Admin Live"</strong> checkbox above to simulate the roles & permissions of a lead regional moderator. Once enabled, you can manage active spots on-screen.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Section 1: Create custom flavor dynamically */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <FolderPlus className="h-4 w-4" /> 1. Introduce Specialty Flavor
            </h4>
            <p className="text-[11px] text-slate-400">
              Discovered a new limited formulation? Add it below so users around Atlanta can immediately select it when reporting.
            </p>

            <form onSubmit={handleCreateFlavor} className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Flavor Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Surge Original Retro"
                    value={newFlavorName}
                    onChange={(e) => setNewFlavorName(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Manufacturer/Brand</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Coca-Cola Company"
                    value={newFlavorBrand}
                    onChange={(e) => setNewFlavorBrand(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Rarity Classification</label>
                  <select 
                    value={newFlavorRarity}
                    onChange={(e) => setNewFlavorRarity(e.target.value as any)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-hidden"
                  >
                    <option value="All-Time Rare">All-Time Rare</option>
                    <option value="Limited Edition">Limited Edition</option>
                    <option value="Regional Craft">Regional Craft</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Category Group</label>
                  <select 
                    value={newFlavorCategory}
                    onChange={(e) => setNewFlavorCategory(e.target.value as any)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-hidden"
                  >
                    <option value="Zero Sugar">Zero Sugar</option>
                    <option value="Classic Cola">Classic Cola</option>
                    <option value="Fruit Punch">Fruit Punch</option>
                    <option value="Energy">Energy</option>
                    <option value="Specialty">Specialty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Flavor Notes/Aroma</label>
                <input 
                  type="text" 
                  placeholder="Citrus punch energy blast with real retro sweetener content..."
                  value={flavorDescription}
                  onChange={(e) => setFlavorDescription(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-hidden"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer text-center"
              >
                + Register New Soda Variety
              </button>
            </form>
          </div>

          {/* Section 2: Global Push Announcement Alert Broadcast */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Volume2 className="h-4 w-4" /> 2. Dispatch Broadcast Notification
            </h4>
            <p className="text-[11px] text-slate-400">
              Send a simulated real-time Push Notification to all collectors with an active mobile app session.
            </p>

            <form onSubmit={handlePushGlobalAnnouncement} className="space-y-2 pt-1">
              <input 
                type="text" 
                placeholder="Alert Header"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                required
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-bold"
              />
              <textarea 
                placeholder="Write detailed push text..."
                value={alertBody}
                onChange={(e) => setAlertBody(e.target.value)}
                required
                rows={2}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              />
              <button 
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
              >
                Emit Live Push Alert!
              </button>
            </form>
          </div>

          {/* Section 3: Active Crowd Records Listing for Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              3. Spot Records Fast Moderation ({spottings.length})
            </h4>
            
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {spottings.map((s) => (
                <div key={s.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between gap-2.5">
                  <div className="truncate">
                    <p className="font-bold text-slate-200 truncate">{s.flavorName}</p>
                    <p className="text-slate-400 text-[10px] truncate">{s.storeName} &bull; {s.size}</p>
                    <div className="flex gap-2 text-[9px] mt-1">
                      <span className="text-emerald-400 font-semibold font-mono">👍 {s.confirmations}</span>
                      <span className="text-rose-400 font-semibold font-mono">👎 {s.denials}</span>
                      <span className="text-slate-500 font-mono">Lister: {s.reportedBy}</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => handleMarkAsSuperRare(s.id)}
                      title="Promote and double bounty rewards"
                      className="bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 p-1.5 rounded-lg border border-indigo-800 cursor-pointer"
                    >
                      <Award className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleFlagReport(s.id)}
                      title="Flag report as doubtful"
                      className="bg-amber-900/60 hover:bg-amber-900 text-amber-300 p-1.5 rounded-lg border border-amber-800 cursor-pointer"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteReport(s.id)}
                      title="Delete spotting record permanently"
                      className="bg-rose-950 hover:bg-rose-900 text-rose-300 p-1.5 rounded-lg border border-rose-900 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
