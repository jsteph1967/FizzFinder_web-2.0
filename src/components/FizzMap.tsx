import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SodaSpotting, GeoLocation } from '../types';

interface FizzMapProps {
  spottings: SodaSpotting[];
  selectedSpotting: SodaSpotting | null;
  onSelectSpotting: (spot: SodaSpotting | null) => void;
  userLocation: GeoLocation;
  reportingMode: boolean;
  onSelectReportLocation: (coords: { latitude: number; longitude: number; address: string }) => void;
}

export default function FizzMap({
  spottings,
  selectedSpotting,
  onSelectSpotting,
  userLocation,
  reportingMode,
  onSelectReportLocation,
}: FizzMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Helper to get color code by stock level
  const getStockColor = (level: string) => {
    switch (level) {
      case 'Full Shelf':
        return '#10b981'; // emerald-500
      case 'High':
        return '#059669'; // emerald-600
      case 'Medium':
        return '#f59e0b'; // amber-500
      case 'Low':
        return '#ea580c'; // orange-600
      case 'Out of Stock':
        return '#ef4444'; // red-500
      default:
        return '#64748b'; // slate-500
    }
  };

  // Helper to create a custom SVG marker based on spotting info
  const createMarkerIcon = (spotting: SodaSpotting, isSelected: boolean) => {
    const color = getStockColor(spotting.stockLevel);
    const scale = isSelected ? 'scale-125 z-50' : 'scale-100';
    const ringColor = isSelected ? '#1e293b' : '#ffffff';
    const isMelloYello = spotting.flavorId === 'mello-yello-zero';

    const svgIcon = `
      <div class="relative ${scale} custom-fizz-marker flex items-center justify-center w-10 h-10 rounded-full shadow-lg border-2" style="background-color: ${color}; border-color: ${ringColor}; transition: all 0.2s ease;">
        <!-- Glowing aura for Mello Yello Sugar Zero (user favorite) or rare imports -->
        ${isMelloYello ? `<div class="absolute -inset-1.5 rounded-full bg-yellow-400 opacity-40 animate-ping"></div>` : ''}
        ${spotting.category === 'Rare Import' ? `<div class="absolute -inset-1 rounded-full bg-indigo-500 opacity-35 animate-pulse"></div>` : ''}
        
        <!-- Soda can vector logo -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-5 h-5 text-white">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path d="M12 2v20M17 5H7" />
        </svg>
        
        <!-- Quick small indicator of stock status -->
        <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 text-[8px] font-bold text-white border border-white">
          ${spotting.stockLevel === 'Full Shelf' ? 'F' : spotting.stockLevel === 'High' ? 'H' : spotting.stockLevel === 'Medium' ? 'M' : spotting.stockLevel === 'Low' ? 'L' : 'X'}
        </span>
      </div>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'custom-div-container',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use default coordinates (Atlanta, GA)
    const map = L.map(mapContainerRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 13,
      zoomControl: false, // will add custom position below
    });

    // Elegant monochrome/minimal tile layer to let soda colors stand out
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a> contributors',
    }).addTo(map);

    // Custom zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create marker groups
    const markersGroup = L.featureGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Click handler on map for spotting reporting
    map.on('click', async (e: L.LeafletMouseEvent) => {
      // We only execute this if we are in active reporting mode
      const { lat, lng } = e.latlng;
      
      // Reverse geocoding estimation using free openstreetmap nominatim
      let addressStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
        if (res.ok) {
          const dict = await res.json();
          if (dict.display_name) {
            // Shorten standard long nominatim addresses
            const split = dict.display_name.split(',');
            addressStr = split.slice(0, 3).join(',').trim();
          }
        }
      } catch (err) {
        console.warn('Geocoding failed, using coordinates format', err);
      }
      
      onSelectReportLocation({
        latitude: lat,
        longitude: lng,
        address: addressStr,
      });
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Render Markers & Keep Synced
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear existing markers
    markersGroup.clearLayers();

    // Re-draw listing markers
    spottings.forEach((spotting) => {
      const isSelected = selectedSpotting?.id === spotting.id;
      const marker = L.marker([spotting.latitude, spotting.longitude], {
        icon: createMarkerIcon(spotting, isSelected),
      });

      // Simple, beautiful interactive popup with button
      const pcolor = getStockColor(spotting.stockLevel);
      const popupHtml = `
        <div class="flex flex-col gap-2 select-none">
          <div class="flex items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
            <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">${spotting.brand}</span>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold text-white uppercase" style="background-color: ${pcolor};">
              ${spotting.stockLevel}
            </span>
          </div>
          <div>
            <h4 class="font-sans font-bold text-slate-900 text-sm leading-tight">${spotting.flavorName}</h4>
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 mt-0.5 font-sans">
              <span>📦 ${spotting.size}</span>
              <span class="text-slate-300">|</span>
              <span class="text-slate-600">${spotting.storeName}</span>
            </div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>⭐ ${spotting.storeRating.toFixed(1)} / 5</span>
            <span>👍 ${spotting.confirmations} confirms</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        offset: [0, -10],
      });

      // Events
      marker.on('click', () => {
        onSelectSpotting(spotting);
        marker.openPopup();
      });

      markersGroup.addLayer(marker);

      // Programmatically open popup if selected via sidebar
      if (isSelected) {
        map.setView([spotting.latitude, spotting.longitude], 14, { animate: true });
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    });
  }, [spottings, selectedSpotting]);

  // 3. User Location Sync (Pulsing Center)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const customUserIcon = L.divIcon({
      html: `<div class="user-gps-pulse"></div>`,
      className: 'custom-user-gps-container',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
    } else {
      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: customUserIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup('<span class="text-xs font-semibold text-blue-600">You are here (Simulated)</span>', { closeButton: false });
    }

    // Centering the map around user coordinates when simulation starts/repositions
    map.setView([userLocation.latitude, userLocation.longitude], map.getZoom(), { animate: true });
  }, [userLocation]);

  return (
    <div className="relative w-full h-full min-h-[350px] overflow-hidden rounded-2xl shadow-sm border border-slate-100 flex flex-col bg-slate-100">
      {/* Map Division */}
      <div id="fizzfinder-live-map" ref={mapContainerRef} className="w-full h-full flex-1 z-10" />

      {/* Map overlays / Guides in Reporting Mode */}
      {reportingMode && (
        <div className="absolute top-4 left-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl text-white shadow-xl flex items-center gap-3 border border-emerald-500/30 text-xs animate-bounce animate-once">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="flex-1 font-sans">
            <span className="font-bold text-emerald-400">Map Spotting Mode Active:</span> Tap/click anywhere on the map to pin your soda find coordinates!
          </p>
        </div>
      )}
    </div>
  );
}
