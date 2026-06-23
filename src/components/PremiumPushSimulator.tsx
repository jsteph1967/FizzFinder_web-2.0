import { useState, useEffect, useRef } from 'react';
import { SodaSpotting, GeoLocation } from '../types';
import { Bell, ShieldCheck, Map, Play, Pause, Compass, Zap, Check } from 'lucide-react';

interface PremiumPushSimulatorProps {
  userLocation: GeoLocation;
  setUserLocation: (loc: GeoLocation) => void;
  spottings: SodaSpotting[];
  isPremium: boolean;
  setIsPremium: (starred: boolean) => void;
  onSelectSpotting: (spot: SodaSpotting) => void;
}

export default function PremiumPushSimulator({
  userLocation,
  setUserLocation,
  spottings,
  isPremium,
  setIsPremium,
  onSelectSpotting,
}: PremiumPushSimulatorProps) {
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [currentRouteIndex, setCurrentRouteIndex] = useState<number>(0);
  const [pushAlert, setPushAlert] = useState<{
    show: boolean;
    title: string;
    body: string;
    spotting: SodaSpotting | null;
  }>({
    show: false,
    title: '',
    body: '',
    spotting: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Path coordinates around Midtown Atlanta (simulating stroll near Midtown Kroger & Chevron)
  const MIDTOWN_STROLL_COORDS = [
    { latitude: 33.7715, longitude: -84.3685, desc: 'Piedmont Ave Junction' },
    { latitude: 33.7661, longitude: -84.3582, desc: 'Ponce De Leon Intersection' },
    { latitude: 33.7431, longitude: -84.3512, desc: 'Glenwood Crossing Driveway' },
    { latitude: 33.7405, longitude: -84.3465, desc: 'Arriving at Midtown Kroger Mall!' }, // Nearest spot-1 (Mello Yello Zero!)
    { latitude: 33.7511, longitude: -84.3411, desc: 'Moreland Ave Stroll' },
    { latitude: 33.7661, longitude: -84.3496, desc: 'Arriving at Corner Specialty Imports!' }, // Nearest spot-2 (Surge!)
  ];

  // Haversine distance helper (miles)
  const getDistanceMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Run location driver loop
  useEffect(() => {
    if (simulationActive) {
      intervalRef.current = setInterval(() => {
        setCurrentRouteIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % MIDTOWN_STROLL_COORDS.length;
          const targetCoords = MIDTOWN_STROLL_COORDS[nextIndex];
          setUserLocation({
            latitude: targetCoords.latitude,
            longitude: targetCoords.longitude,
          });
          return nextIndex;
        });
      }, 5000); // Shift simulated location every 5 seconds
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simulationActive]);

  // Proximity Alert Trigger Monitor
  useEffect(() => {
    if (!isPremium) return;

    // Scan for any in-stock soda within 0.4 miles
    const nearbySpottings = spottings.filter((spot) => {
      if (spot.stockLevel === 'Out of Stock') return false;
      const distance = getDistanceMiles(
        userLocation.latitude,
        userLocation.longitude,
        spot.latitude,
        spot.longitude
      );
      return distance <= 0.4;
    });

    if (nearbySpottings.length > 0) {
      // Choose closest
      const closestSpot = nearbySpottings.reduce((prev, curr) => {
        const d1 = getDistanceMiles(userLocation.latitude, userLocation.longitude, prev.latitude, prev.longitude);
        const d2 = getDistanceMiles(userLocation.latitude, userLocation.longitude, curr.latitude, curr.longitude);
        return d1 < d2 ? prev : curr;
      });

      const dist = getDistanceMiles(
        userLocation.latitude,
        userLocation.longitude,
        closestSpot.latitude,
        closestSpot.longitude
      );

      // Trigger standard audio synthesis beep if supported, or play simple audio feedback context.
      try {
        const synth = window.speechSynthesis;
        if (synth && !pushAlert.show) {
          const speech = new SpeechSynthesisUtterance(`Proximity alert: ${closestSpot.flavorName} spotted nearby`);
          speech.volume = 0.5;
          speech.rate = 1.1;
          synth.speak(speech);
        }
      } catch (e) {
        // no-op if audio synthesis is blocklisted inside browser iframe
      }

      setPushAlert({
        show: true,
        title: `🚨 Push Alert: ${closestSpot.flavorName} Spotted!`,
        body: `Only ${dist.toFixed(2)} miles away at ${closestSpot.storeName} (${closestSpot.size} • ${closestSpot.stockLevel} stock!).`,
        spotting: closestSpot,
      });

      // Slide away after 7 seconds
      const timer = setTimeout(() => {
        setPushAlert((prev) => ({ ...prev, show: false }));
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [userLocation, isPremium, spottings]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
      {/* Dynamic Push Banner popup widget inside the DOM */}
      {pushAlert.show && pushAlert.spotting && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm bg-slate-900 border-l-4 border-amber-400 text-white rounded-xl p-4 shadow-2xl flex gap-3 animate-bounce animate-once font-sans">
          <div className="flex-1">
            <h4 className="font-bold text-sm tracking-tight flex items-center gap-1.5 text-amber-300">
              <Bell className="h-4 w-4 text-amber-300 animate-pulse" />
              {pushAlert.title}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{pushAlert.body}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  if (pushAlert.spotting) {
                    onSelectSpotting(pushAlert.spotting);
                    setPushAlert((prev) => ({ ...prev, show: false }));
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                View on Map
              </button>
              <button
                onClick={() => setPushAlert((prev) => ({ ...prev, show: false }))}
                className="text-slate-400 hover:text-white text-[10px] px-2.5 py-1 rounded-md font-sans cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Card */}
      <div className={`rounded-xl p-4 border transition-all ${
        isPremium
          ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 border-indigo-500/30 text-white shadow-md'
          : 'bg-slate-50 border-slate-150 text-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-5 w-5 ${isPremium ? 'text-amber-400' : 'text-slate-400'}`} />
            <div>
              <h3 className="font-sans font-bold text-sm flex items-center gap-1">
                FizzFinder Pro Subscription
                {isPremium && <span className="text-[9px] bg-amber-400/90 text-slate-950 px-1.5 py-0.5 rounded-full font-sans uppercase font-black">ACTIVE</span>}
              </h3>
              <p className={`text-[11px] mt-0.5 ${isPremium ? 'text-slate-300' : 'text-slate-500'}`}>
                Push Geo-fencing alerts when within 0.4 miles of rare sodas
              </p>
            </div>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="mt-4 flex items-center justify-between border-t pt-3 border-slate-200/20">
          <span className={`text-xs font-mono select-none ${isPremium ? 'text-indigo-200' : 'text-slate-600'}`}>
            {isPremium ? '🔓 Pro Mode Unlocked' : 'Subscription Status: Free Plan'}
          </span>
          <button
            onClick={() => setIsPremium(!isPremium)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              isPremium
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-900'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xs'
            }`}
          >
            {isPremium ? 'Downgrade to Free' : 'Get Tracker Pro ($0 Mock-up)'}
          </button>
        </div>
      </div>

      {/* GPS Geo simulator driver */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 font-mono tracking-wider mb-2 flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-indigo-500 animate-spin-slow" />
          SIMULATED GPS DRIVER
        </h4>

        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-2">
          <div className="text-slate-600 leading-relaxed">
            Since browsers restriction block notifications background loops inside sandbox iframes, we’ve built an <strong className="text-slate-800">interactive GPS simulator</strong> so you can watch live geofences trigger in action.
          </div>

          <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-100 font-mono text-[10px]">
            <span className="text-slate-400">Position coords:</span>
            <span className="text-slate-700 font-bold">{userLocation.latitude.toFixed(4)}N, {userLocation.longitude.toFixed(4)}W</span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => {
                setSimulationActive(!simulationActive);
                if (!simulationActive && !isPremium) {
                  // Recommend Pro
                  alert('Proximity background notifications require FizzFinder Pro! Turn on FizzFinder Pro above for the push alerts to trigger.');
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                simulationActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {simulationActive ? (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" /> Stop Strolling
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Simulate Midtown Stroll
                </>
              )}
            </button>
            <button
              onClick={() => {
                // Reset location to Midtown center
                setUserLocation({ latitude: 33.749, longitude: -84.388 });
                setSimulationActive(false);
                setCurrentRouteIndex(0);
              }}
              className="px-2 py-1.5 border border-slate-200 hover:bg-white rounded-lg text-slate-500 text-[10px] font-sans transition-colors cursor-pointer"
            >
              Reset GPS
            </button>
          </div>

          {simulationActive && (
            <div className="flex gap-1.5 flex-wrap pt-1 text-[10px] text-indigo-600">
              <span className="flex h-1.5 w-1.5 mt-1 rounded-full bg-emerald-500 animate-ping" />
              <span>Simulated Movement: {MIDTOWN_STROLL_COORDS[currentRouteIndex].desc}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
