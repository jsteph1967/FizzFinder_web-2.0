import React, { useState, useEffect } from 'react';
import { Sparkles, Code, Smartphone, Globe, AlertCircle, X } from 'lucide-react';

interface AdBannerProps {
  isPremium: boolean;
  position: 'sidebar' | 'map-bottom' | 'details';
}

const MOCK_ADS = [
  {
    title: "🍔 Craving Burgers with that Soda?",
    desc: "Get 20% off your next delivery from FlameGrill Atlanta. Code: SODAFIZZ",
    cta: "Order Now",
    sponsor: "FlameGrill Delivery"
  },
  {
    title: "🍿 Popcorn & Carbonation - Perfect Fit!",
    desc: "Try KettleCorn Sweet & Salty's new party bag. Zero artificial sweeteners.",
    cta: "Claim Sample",
    sponsor: "KettleCorn Co."
  },
  {
    title: "🚗 Need a Ride to the Soda Retailer?",
    desc: "SipSafe rides provides $5 credits for all local Atlanta craft store voyages.",
    cta: "Get Code",
    sponsor: "SipSafe Rides"
  },
  {
    title: "🔋 Energy Level Low? Try JoltX!",
    desc: "High-octane performance beverage. Relaunched in vintage formulation.",
    cta: "Find Near Me",
    sponsor: "JoltX Vintage"
  }
];

export default function AdBanner({ isPremium, position }: AdBannerProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showIntegrationInfo, setShowIntegrationInfo] = useState(false);

  // Rotate custom ads every 10 seconds to simulate a live ad container
  useEffect(() => {
    if (isPremium) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % MOCK_ADS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [isPremium]);

  if (isPremium) {
    // Return a sleek gold ribbon indicating an ad-free experience, or return null
    return null;
  }

  const ad = MOCK_ADS[currentAdIndex];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 relative overflow-hidden shadow-2xs transition-all duration-300">
      {/* Sponsor Label */}
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-black text-slate-400 bg-slate-200 px-1 py-0.5 rounded uppercase tracking-wider font-mono">
            Google AdSense / AdMob
          </span>
          <span className="text-[10px] text-slate-400 font-medium font-sans italic">
            Sponsor: {ad.sponsor}
          </span>
        </div>
        
        <button 
          onClick={() => setShowIntegrationInfo(!showIntegrationInfo)}
          className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold font-mono tracking-tight flex items-center gap-1 cursor-pointer"
          title="See developer instructions to integrate Google Ads"
        >
          <Code className="h-3 w-3" />
          {showIntegrationInfo ? 'Hide Code' : 'Get Ads setup'}
        </button>
      </div>

      {/* Main content */}
      <div className="flex items-start justify-between gap-3 font-sans">
        <div className="space-y-1">
          <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
            {ad.title}
          </h5>
          <p className="text-xs text-slate-500 leading-snug">
            {ad.desc}
          </p>
        </div>
        <button 
          onClick={() => alert(`This simulates a Google Ad click redirecting a standard user to the sponsor's website.`)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 whitespace-nowrap cursor-pointer transition-all shrink-0"
        >
          {ad.cta}
          <span className="text-[10px]">&rarr;</span>
        </button>
      </div>

      {/* Rarity Level / Pro Upgrade Prompt */}
      <div className="mt-2.5 pt-1.5 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
        <span>🎉 Upgrade to premium to permanently disable all sponsored banners!</span>
        <span className="font-bold text-amber-500 flex items-center gap-0.5 font-mono">
          <Sparkles className="h-2.5 w-2.5 text-amber-500 animate-spin-slow" />
          GO AD-FREE PRO
        </span>
      </div>

      {/* Integration info box */}
      {showIntegrationInfo && (
        <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono space-y-2.5 border border-slate-800 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-yellow-400 font-bold">&#10024; MONETIZATION Blueprints:</span>
            <button 
              onClick={() => setShowIntegrationInfo(false)}
              className="text-slate-400 hover:text-slate-100 font-bold font-sans"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-1.5">
            <h6 className="text-[10px] font-black text-rose-300 uppercase tracking-widest flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> 1. WEB: Google AdSense Setup
            </h6>
            <p className="text-xs text-slate-400">
              For your website build, paste this script snippet inside your <code className="text-white bg-slate-800 px-1 rounded">index.html</code>:
            </p>
            <pre className="bg-slate-950 p-2 rounded-lg text-emerald-400 overflow-x-auto text-[10px] max-h-24">
{`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXX" crossorigin="anonymous"></script>
<!-- Ad Unit -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXX"
     data-ad-slot="ZZZZZZZZZZ"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`}
            </pre>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <h6 className="text-[10px] font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5" /> 2. MOBILE APP: Capacitor AdMob Setup
            </h6>
            <p className="text-xs text-slate-400">
              In your compiled android wrapper folder, install the community AdMob plugin:
            </p>
            <pre className="bg-slate-950 p-2 rounded-lg text-emerald-300 overflow-x-auto text-[10px]">
npm install @capacitor-community/admob
npx cap sync android
            </pre>
            <p className="text-xs text-slate-400">
              Initialize inside your React bootstrap hook:
            </p>
            <pre className="bg-slate-950 p-2 rounded-lg text-emerald-400 overflow-x-auto text-[10px] max-h-24">
{`import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

async function initAdMob() {
  await AdMob.initialize({
    testingDevices: ['YOUR_TESTING_DEVICE_ID'],
    initializeForTesting: true,
  });
  
  // Render Banner Ad Frame on mobile viewports
  await AdMob.showBanner({
    adId: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 60,
  });
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
