import React from 'react';
import { 
  Shield, 
  MapPin, 
  User, 
  Mail, 
  Cookie, 
  Lock, 
  FileText, 
  ArrowLeft, 
  CheckCircle, 
  Calendar,
  Scale
} from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  // Current date for Google Play compliance
  const lastUpdated = "June 22, 2026";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
        
        {/* Header Block */}
        <div className="bg-slate-900 text-white p-6 relative flex-none">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md border border-indigo-400">
              <Shield className="h-5 w-5 text-indigo-100" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight font-sans">FizzFinder Privacy Policy</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 font-mono">
                <Calendar className="h-3.5 w-3.5" />
                <span>Last Updated: {lastUpdated}</span>
              </div>
            </div>
          </div>
          
          <button 
            type="button"
            id="privacy-close-top-btn"
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg cursor-pointer"
            aria-label="Close Privacy Policy"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Policy Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 font-sans text-slate-700 text-sm leading-relaxed scrollbar-thin">
          
          {/* Introduction Card */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 md:p-5 flex gap-4">
            <Scale className="h-8 w-8 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide font-sans">Google Play Store & Developer Trust</h3>
              <p className="text-xs text-slate-600">
                At FizzFinder, we value your trust above all. This Privacy Policy outlines how our application collects, utilizes, and protects your information when you discover, spot, and share specialty soft-drink and soda locations.
              </p>
            </div>
          </div>

          {/* Section 1: Information Collection */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <FileText className="h-5 w-5 text-indigo-600" />
              1. Information We Collect
            </h3>
            <p>
              To provide a fully-functional crowdsourced soda discovery map, FizzFinder collects minimal essential user contributions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li><strong>User Nickname:</strong> An custom identifier you key in for posting physical soft-drink shelf updates.</li>
              <li><strong>Leaderboard Stats:</strong> Spotting and contributions count tied to your contributor identifier to award reputation ranks.</li>
              <li><strong>Google Authentication Profile Metadata:</strong> Handled securely if you choose to connect Google Sign-In, recording your public display name, email, and avatar picture.</li>
            </ul>
          </section>

          {/* Section 2: Location Data Handling */}
          <section className="space-y-3 bg-indigo-50/40 rounded-2xl p-4 border border-indigo-100">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <MapPin className="h-5 w-5 text-indigo-600 animate-pulse" />
              2. Precise Location Data Use Cases
            </h3>
            <p className="text-slate-700">
              Because FizzFinder centers around physical soda container positioning on the map, we request geolocation coordinates:
            </p>
            <div className="space-y-2 text-xs text-slate-650 pl-2 border-l-2 border-indigo-300">
              <p>
                <strong>Map Geolocation coordinates:</strong> When active, the application uses coordinates solely to display your relative distance to spotted stores and enable you to pinpoint new retailers.
              </p>
              <p>
                <strong>No Background Tracking:</strong> FizzFinder does NOT query or transmit coordinates in the background when the app is minimized or dismissed. Your device coordinates remain local and transient. Only physical soda spotting coordinates chosen by you are saved in our Firebase store.
              </p>
            </div>
          </section>

          {/* Section 3: Identity & Google Authentication */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <User className="h-5 w-5 text-indigo-600" />
              3. Google Authentication Integration
            </h3>
            <p>
              Users can link their Google Account to personalize contribution ranks. If linked, we record your public profile status securely in FireStore in order to prevent robotic sprains and spam records. We do not sell or index your profile information. You can log out / disconnect your Google profile instantly from the home panel.
            </p>
          </section>

          {/* Section 4: Cookies & Ads */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Cookie className="h-5 w-5 text-indigo-600" />
              4. Cookies, Storage, & Ad Revenue Models
            </h3>
            <p>
              To support development and index specialty soft-drinks:
            </p>
            <div className="space-y-2 text-xs text-slate-600 pl-4 list-decimal">
              <p>
                &bull; We persist state using local storage devices for your filters and applet sessions.
              </p>
              <p>
                &bull; Standard accounts utilize Google Ad banners within details slots. These networks may leverage analytical parameters to optimize delivery metrics. Premium Alert subscribers have all tracker Ads disabled.
              </p>
            </div>
          </section>

          {/* Section 5: Security */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Lock className="h-5 w-5 text-indigo-600" />
              5. Data Governance & Secure Storage
            </h3>
            <p>
              All soda spotting positions, names, and timeline records are stored within real-time Google Cloud Firestore tables. We employ standard database encryption and network barriers to guard database tables against unlawful infiltration operations.
            </p>
          </section>

          {/* Section 6: Contact Information */}
          <section className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Mail className="h-5 w-5 text-indigo-600" />
              6. Developer Support & Contact Details
            </h3>
            <p className="text-xs">
              If you have any questions about this Privacy Policy, your saved profile listings, or wish to request immediate profile deletion, please submit an outline request to:
            </p>
            <div className="mt-2 font-mono text-indigo-700 bg-white inline-block px-3 py-1.5 rounded-lg border border-slate-250 text-xs font-bold shadow-2xs">
              jsteph1967@gmail.com
            </div>
          </section>

        </div>

        {/* Footer actions bar */}
        <div className="bg-slate-50 px-6 py-4 flex-none border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Fully Compliant with Play Store & COPPA Regulations</span>
          </div>
          <button
            type="button"
            id="privacy-close-btn"
            onClick={onClose}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl shadow-md transition-all active:scale-97 cursor-pointer select-none text-center"
          >
            I Acknowledge
          </button>
        </div>

      </div>
    </div>
  );
}
