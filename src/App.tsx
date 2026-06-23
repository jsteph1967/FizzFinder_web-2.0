import React, { useState, useEffect } from 'react';
import { SodaSpotting, SodaFlavor, UserFinder, GeoLocation, StockLevel, Comment } from './types';
import { SPECIALTY_FLAVORS, INITIAL_SPOTTINGS, TOP_FINDERS } from './data';
import FizzMap from './components/FizzMap';
import Leaderboard from './components/Leaderboard';
import ReportForm from './components/ReportForm';
import PremiumPushSimulator from './components/PremiumPushSimulator';
import AdBanner from './components/AdBanner';
import AdminPanel from './components/AdminPanel';
import PrivacyPolicy from './components/PrivacyPolicy';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  ThumbsUp, 
  ThumbsDown, 
  PlusCircle, 
  MessageSquare, 
  X, 
  Flame, 
  Store,
  ChevronRight,
  User,
  BadgeAlert,
  HelpCircle,
  HelpCircle as QuestionIcon,
  ChevronsUpDown,
  Compass,
  Shield
} from 'lucide-react';

// Live Firestore integration imports
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, signInWithGoogle, logOut, handleFirestoreError, OperationType, testConnection } from './firebase';

export default function App() {
  // --- STATE ---
  const [spottings, setSpottings] = useState<SodaSpotting[]>([]);
  const [finders, setFinders] = useState<UserFinder[]>([]);
  const [selectedSpotting, setSelectedSpotting] = useState<SodaSpotting | null>(null);
  const [selectedComments, setSelectedComments] = useState<Comment[]>([]);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  
  // Custom states
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<GeoLocation>({ latitude: 33.7490, longitude: -84.3880 }); // Midtown Atlanta center
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [flavorFilter, setFlavorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(25); // value in miles
  
  // Map picking and forms
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [reportingModeActive, setReportingModeActive] = useState<boolean>(false);
  const [mapSelectedCoords, setMapSelectedCoords] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  
  // Mini auxiliary panels
  const [activeTab, setActiveTab] = useState<'listings' | 'leaderboard' | 'premium' | 'admin'>('listings');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isAdminActive, setIsAdminActive] = useState<boolean>(false);
  const [customFlavors, setCustomFlavors] = useState<SodaFlavor[]>([]);
  const [globalAnnouncement, setGlobalAnnouncement] = useState<{ title: string; body: string } | null>(null);
  const [isRefreshingRankings, setIsRefreshingRankings] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [userNickname, setUserNickname] = useState<string>('FizzGuest');

  // --- AUTOMATIC DATABASE SEEDER ---
  const seedDatabase = async () => {
    try {
      console.log("Database empty. Seeding defaults...");
      // 1. Seed Flavors
      for (const flavor of SPECIALTY_FLAVORS) {
        await setDoc(doc(db, 'flavors', flavor.id), flavor);
      }
      
      // 2. Seed Spottings & comments subcollections
      for (const spot of INITIAL_SPOTTINGS) {
        const { comments, ...rest } = spot;
        await setDoc(doc(db, 'spottings', spot.id), {
          ...rest,
          createdAt: new Date().toISOString()
        });
        
        for (const comment of comments) {
          await setDoc(doc(db, 'spottings', spot.id, 'comments', comment.id), {
            ...comment,
            createdAt: new Date().toISOString()
          });
        }
      }
      
      // 3. Seed User Rankings
      for (const finder of TOP_FINDERS) {
        await setDoc(doc(db, 'users', `finder-${finder.username.toLowerCase()}`), {
          ...finder,
          userId: `finder-${finder.username.toLowerCase()}`,
          createdAt: new Date().toISOString()
        });
      }
      console.log("Seeding complete!");
    } catch (e) {
      console.error("Error during initial Firebase seeding:", e);
    }
  };

  // --- INITIALIZATION (Firebase Real-time Sync) ---
  useEffect(() => {
    // 1. Test Firebase Connection
    testConnection();

    // 2. Auth State Changed Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setUserNickname(user.displayName?.split(' ')[0] || 'FizzFinder');
        
        // Sync user profile with Firestore users collection
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const profileSnapshot = await getDocs(query(collection(db, 'users')));
          let exists = false;
          profileSnapshot.forEach((doc) => {
            if (doc.id === user.uid) exists = true;
          });
          
          if (!exists) {
            // New user registration profile inside Firestore
            const newUserProfile: UserFinder = {
              userId: user.uid,
              username: user.displayName || 'AnonymousFinder',
              reputationPoints: 120, // Start reputation
              contributionsCount: 1,
              accuracyRate: 100,
              badge: 'Fizz Cadet',
              avatarColor: 'from-violet-500 to-indigo-600'
            };
            await setDoc(userDocRef, newUserProfile);
          }

          // Trigger seeding if we are the bootstrapped admin and the DB is blank
          if (user.email === "jsteph1967@gmail.com") {
            const spottingsRef = collection(db, 'spottings');
            const spottingsSnap = await getDocs(query(spottingsRef));
            if (spottingsSnap.empty) {
              await seedDatabase();
            }
          }
        } catch (error) {
          console.error("Failed to sync auth user profile or check database, maybe permissions offline:", error);
        }
      } else {
        setUserNickname('FizzGuest');
      }
    });

    // 3. Real-time Spottings Loader
    const qSpottings = query(collection(db, 'spottings'));
    const unsubscribeSpottings = onSnapshot(qSpottings, (snapshot) => {
      if (snapshot.empty) {
        if (auth.currentUser) {
          seedDatabase();
        } else {
          // Fallback to local memory until seeded or signed in
          setSpottings(INITIAL_SPOTTINGS);
        }
        return;
      }
      const spottingsData: SodaSpotting[] = [];
      snapshot.forEach((doc) => {
        spottingsData.push(doc.data() as SodaSpotting);
      });
      setSpottings(spottingsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'spottings');
    });

    // 4. Real-time Leaderboard/Finders Loader
    const qFinders = query(collection(db, 'users'), orderBy('reputationPoints', 'desc'));
    const unsubscribeFinders = onSnapshot(qFinders, (snapshot) => {
      if (snapshot.empty) {
        // Fallback to local memory until seeded
        let currentRank = 1;
        setFinders(TOP_FINDERS.map(f => ({ ...f, rank: currentRank++ })));
        return;
      }
      const findersData: UserFinder[] = [];
      let currentRank = 1;
      snapshot.forEach((doc) => {
        findersData.push({
          ...(doc.data() as UserFinder),
          rank: currentRank++
        });
      });
      setFinders(findersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // 5. Real-time Specialty Flavors Loader
    const qFlavors = query(collection(db, 'flavors'));
    const unsubscribeFlavors = onSnapshot(qFlavors, (snapshot) => {
      const flavorsData: SodaFlavor[] = [];
      snapshot.forEach((doc) => {
        flavorsData.push(doc.data() as SodaFlavor);
      });
      // Custom ones are catalog entries that aren't in default hardcoded array
      const customOnes = flavorsData.filter(f => !SPECIALTY_FLAVORS.some(sf => sf.id === f.id));
      setCustomFlavors(customOnes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'flavors');
    });

    // Load Premium Sub state from localStorage
    const sub = localStorage.getItem('fizz_premium');
    if (sub) {
      setIsPremium(JSON.parse(sub));
    }

    return () => {
      unsubscribeAuth();
      unsubscribeSpottings();
      unsubscribeFinders();
      unsubscribeFlavors();
    };
  }, []);

  // Support direct linking/deep linking to Privacy Policy for Play Store reviewers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('privacy') === 'true' || window.location.hash === '#privacy') {
      setIsPrivacyOpen(true);
    }
  }, []);

  // Sync selected spotting's comments in real-time as a subcollection
  useEffect(() => {
    if (!selectedSpotting) {
      setSelectedComments([]);
      return;
    }
    const qComments = query(collection(db, 'spottings', selectedSpotting.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((doc) => {
        commentsData.push(doc.data() as Comment);
      });
      setSelectedComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `spottings/${selectedSpotting.id}/comments`);
    });
    return () => unsubscribeComments();
  }, [selectedSpotting]);

  // Auth helper executions
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      alert("Sign in failed. Note that in sandboxed iframes popups might require enabling popup permissions.");
    }
  };

  const handleLogOut = async () => {
    try {
      await logOut();
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  const saveSpottingsToStorage = async (updated: SodaSpotting[]) => {
    // Left for legacy compatibility / admin console triggers
    setSpottings(updated);
  };

  const saveFindersToStorage = async (updated: UserFinder[]) => {
    // Left for legacy compatibility
    setFinders(updated);
  };

  const handleAddCustomFlavor = async (newFlavor: SodaFlavor) => {
    try {
      await setDoc(doc(db, 'flavors', newFlavor.id), newFlavor);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `flavors/${newFlavor.id}`);
    }
  };

  useEffect(() => {
    localStorage.setItem('fizz_premium', JSON.stringify(isPremium));
  }, [isPremium]);

  const allAvailableFlavors = [...SPECIALTY_FLAVORS, ...customFlavors];

  // --- CALCULATE HAVERSINE DISTANCES IN MILES ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  // --- FILTER & SORT SPOTTINGS ---
  const filteredSpottings = spottings.filter((spot) => {
    // 1. Text Search query (compares soda flavor, brand, or store name)
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      spot.flavorName.toLowerCase().includes(query) ||
      spot.brand.toLowerCase().includes(query) ||
      spot.storeName.toLowerCase().includes(query) ||
      spot.storeAddress.toLowerCase().includes(query);

    // 2. Flavor ID dropdown
    const matchesFlavor = flavorFilter === 'all' || spot.flavorId === flavorFilter;

    // 3. Category Filter
    const matchesCategory = categoryFilter === 'all' || spot.category === categoryFilter;

    // 4. Stock level filter
    const matchesStock = 
      stockFilter === 'all' || 
      (stockFilter === 'instock' && spot.stockLevel !== 'Out of Stock') ||
      (spot.stockLevel === stockFilter);

    // 5. Hard geographical distance threshold
    const distance = calculateDistance(userLocation.latitude, userLocation.longitude, spot.latitude, spot.longitude);
    const matchesDistance = distance <= maxDistance;

    return matchesSearch && matchesFlavor && matchesCategory && matchesStock && matchesDistance;
  });

  // --- CROWD CONFIRMATION RATING MECHANISM ---
  // Boosts reporter points when confirmed, penalizes when discredited
  const handleVote = async (spottingId: string, type: 'confirm' | 'deny') => {
    const targetSpot = spottings.find(s => s.id === spottingId);
    if (!targetSpot) return;

    // Prevent duplicate voting
    if (targetSpot.userVoted === type) return;

    let confDelta = 0;
    let denyDelta = 0;

    if (type === 'confirm') {
      confDelta = 1;
      if (targetSpot.userVoted === 'deny') denyDelta = -1;
    } else {
      denyDelta = 1;
      if (targetSpot.userVoted === 'confirm') confDelta = -1;
    }

    const nextConf = Math.max(0, targetSpot.confirmations + confDelta);
    const nextDeny = Math.max(0, targetSpot.denials + denyDelta);

    try {
      const spotDocRef = doc(db, 'spottings', spottingId);
      await updateDoc(spotDocRef, {
        confirmations: nextConf,
        denials: nextDeny
      });

      // Update reporter profile inside users
      const reporter = targetSpot.reportedBy;
      const scoreAward = type === 'confirm' ? 15 : -10;

      // Try locating reporter profile inside users
      const userRefQuery = await getDocs(collection(db, 'users'));
      let reporterUid = '';
      let currentFinder: UserFinder | null = null;
      userRefQuery.forEach((doc) => {
        const u = doc.data() as UserFinder;
        if (u.username.toLowerCase() === reporter.toLowerCase()) {
          reporterUid = doc.id;
          currentFinder = u;
        }
      });

      if (reporterUid && currentFinder) {
        const reporterDocRef = doc(db, 'users', reporterUid);
        const newScore = Math.max(0, (currentFinder as UserFinder).reputationPoints + scoreAward);
        const totalVotes = nextConf + nextDeny;
        const newAccuracy = totalVotes > 0 ? Math.round((nextConf / totalVotes) * 100) : (currentFinder as UserFinder).accuracyRate;

        let updatedBadge = (currentFinder as UserFinder).badge;
        if (newScore > 1100) updatedBadge = 'Sip Master';
        else if (newScore > 850) updatedBadge = 'Carbonation King';
        else if (newScore > 600) updatedBadge = 'Nectar Hunter';
        else if (newScore > 300) updatedBadge = 'Flavor Scout';

        await updateDoc(reporterDocRef, {
          reputationPoints: newScore,
          accuracyRate: Math.min(100, Math.max(30, newAccuracy)),
          badge: updatedBadge
        });
      }

      // Update locally selected spotting userVoted state for visual tracking
      if (selectedSpotting && selectedSpotting.id === spottingId) {
        setSelectedSpotting({
          ...selectedSpotting,
          confirmations: nextConf,
          denials: nextDeny,
          userVoted: type
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `spottings/${spottingId}`);
    }
  };

  // --- SUBMIT COMMENT THREAD ---
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedSpotting) return;

    const commentId = `comment-${Date.now()}`;
    const newComment: Comment = {
      id: commentId,
      username: userNickname.trim() || 'FizzGuest',
      userReputation: currentUser ? 120 : 85,
      text: newCommentText.trim(),
      time: 'Just now'
    };

    try {
      const commentDocRef = doc(db, 'spottings', selectedSpotting.id, 'comments', commentId);
      await setDoc(commentDocRef, {
        ...newComment,
        createdAt: new Date().toISOString()
      });
      setNewCommentText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `spottings/${selectedSpotting.id}/comments/${commentId}`);
    }
  };

  // --- SUBMIT NEW SPOTTED SODA ---
  const handleAddSpottedSoda = async (newItem: Omit<SodaSpotting, 'id' | 'reportedTime' | 'confirmations' | 'denials' | 'comments'>) => {
    const spottingId = `spotting-${Date.now()}`;
    const newlyCreated: Omit<SodaSpotting, 'comments'> = {
      ...newItem,
      id: spottingId,
      reportedTime: 'Just now',
      confirmations: 1,
      denials: 0
    };

    try {
      // 1. Write the spotting
      const spotDocRef = doc(db, 'spottings', spottingId);
      await setDoc(spotDocRef, {
        ...newlyCreated,
        createdAt: new Date().toISOString()
      });

      // 2. Update reporter profile in users
      if (currentUser && newItem.reportedBy !== 'AnonymousFinder' && newItem.reportedBy.trim().length > 0) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        // Find existing profile
        const profileSnapshot = await getDocs(query(collection(db, 'users')));
        let profile: UserFinder | null = null;
        profileSnapshot.forEach((doc) => {
          if (doc.id === currentUser.uid) {
            profile = doc.data() as UserFinder;
          }
        });

        if (profile) {
          await updateDoc(userDocRef, {
            contributionsCount: (profile as UserFinder).contributionsCount + 1,
            reputationPoints: (profile as UserFinder).reputationPoints + 20
          });
        }
      }

      // Reset interface variables
      setIsReporting(false);
      setReportingModeActive(false);
      setMapSelectedCoords(null);
      
      // Select the newly created spotting visually
      setSelectedSpotting({
        ...newlyCreated,
        comments: []
      } as any);

      alert(`Success! "${newItem.flavorName}" spotted at "${newItem.storeName}" has been uploaded to the live database!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `spottings/${spottingId}`);
    }
  };

  // Helper to trigger map picking state
  const handleMapLocationPick = () => {
    setReportingModeActive(true);
  };

  const handleCoordinatesSelectedFromMap = (coords: { latitude: number; longitude: number; address: string }) => {
    if (reportingModeActive) {
      setMapSelectedCoords(coords);
      setReportingModeActive(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFlavorFilter('all');
    setCategoryFilter('all');
    setStockFilter('all');
    setMaxDistance(50);
  };

  const handleRefreshRankings = () => {
    setIsRefreshingRankings(true);
    setTimeout(() => {
      setIsRefreshingRankings(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-screen text-slate-800 bg-slate-50 overflow-hidden font-sans">
      
      {isAdminActive && (
        <div className="bg-rose-600 text-white text-center py-1.5 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 z-50 animate-pulse">
          <span>🛡️</span> ADMIN SYSTEM MODERATION CONSOLE IS ONLINE — EDIT SHELF STOCK, CORRUPT RECORDS, OR REGISTER RARE SODA BRANDS
        </div>
      )}

      {globalAnnouncement && (
        <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 rounded-2xl text-white shadow-xl flex items-center justify-between gap-4 animate-slide-down z-40">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">📢</span>
            <div>
              <h5 className="font-extrabold text-xs uppercase tracking-widest text-slate-100 font-mono">{globalAnnouncement.title}</h5>
              <p className="text-xs font-medium text-white/95 mt-0.5">{globalAnnouncement.body}</p>
            </div>
          </div>
          <button 
            onClick={() => setGlobalAnnouncement(null)}
            className="text-white hover:text-slate-200 font-bold text-lg px-2 hover:scale-110 transition-transform cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}
      
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex-none shadow-xs z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-yellow-300 via-emerald-400 to-yellow-400 rounded-xl flex items-center justify-center shadow-md border-2 border-slate-900 animate-pulse">
              <span className="text-xl font-bold select-none">🥤</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 font-sans flex items-center gap-2">
                FizzFinder
                <span className="text-xs bg-yellow-400/80 text-slate-950 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                  Atlanta Live Base
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Crowdsourced tracking of hard-to-find soda and specialty beverage flavors</p>
            </div>
          </div>

          {/* Subscribed Plan Badge & Global Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {isPremium ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                ⭐ Pro Tracker Member Access
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200">
                Standard Free Tier
              </span>
            )}

            {/* Live Firestore User Auth Status */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1.5 pr-3.5 border border-slate-200 shadow-2xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Finder'}
                    className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                    {currentUser.displayName?.substring(0, 2).toUpperCase() || 'FI'}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-900 leading-tight max-w-[100px] truncate">
                    {currentUser.displayName || 'Finder'}
                  </span>
                  <button 
                    onClick={handleLogOut} 
                    className="text-[9px] text-rose-500 hover:text-rose-700 font-extrabold text-left leading-none uppercase tracking-wider hover:underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl shadow-2xs hover:shadow-xs transition-all active:scale-97 select-none cursor-pointer"
              >
                <User className="h-4 w-4 text-indigo-500" />
                <span>Link Google Account</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsReporting(true);
                setSelectedSpotting(null);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl slider-button shadow-md cursor-pointer transition-all active:scale-97 select-none"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              Spot a Flavor!
            </button>
          </div>

        </div>
      </header>


      {/* MAIN LAYOUT WRAPPER */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto p-4 lg:p-6 gap-6">
        
        {/* LEFT COMPONENT CONTROLLER (Filters, Lists, Leaderboard Tabs) */}
        <section className="lg:w-5/12 xl:w-4/12 flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-none">
          
          {/* Section Panel Tab Headers */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('listings');
                setIsReporting(false);
              }}
              className={`flex-1 min-w-[80px] py-1.5 text-center text-xs font-bold rounded-xl transition-all select-none cursor-pointer ${
                activeTab === 'listings' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              🔍 Find ({filteredSpottings.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('leaderboard');
                setIsReporting(false);
              }}
              className={`flex-1 min-w-[70px] py-1.5 text-center text-xs font-bold rounded-xl transition-all select-none cursor-pointer ${
                activeTab === 'leaderboard' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              🏆 Rank
            </button>
            <button
              onClick={() => {
                setActiveTab('premium');
                setIsReporting(false);
              }}
              className={`flex-1 min-w-[75px] py-1.5 text-center text-xs font-bold rounded-xl transition-all select-none cursor-pointer ${
                activeTab === 'premium' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              🔔 Alerts
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setIsReporting(false);
              }}
              className={`flex-1 min-w-[70px] py-1.5 text-center text-xs font-bold rounded-xl transition-all select-none cursor-pointer flex items-center justify-center gap-0.5 ${
                activeTab === 'admin' ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-200' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              <Shield className="h-3.5 w-3.5 inline shrink-0" />
              Admin
            </button>
          </div>

          {/* LISTINGS TAB VIEW */}
          {activeTab === 'listings' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Search input and Filter Expansion Panel */}
              <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-3.5 flex items-center">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search soda flavor, retailer or brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 text-slate-800 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 font-bold"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Toggles */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 font-mono mb-1 uppercase">SODA FLAVOR</label>
                    <select
                      value={flavorFilter}
                      onChange={(e) => setFlavorFilter(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-hidden text-slate-700 font-mono"
                    >
                      <option value="all">All Specialties</option>
                      {allAvailableFlavors.map(flavor => (
                        <option key={flavor.id} value={flavor.id}>{flavor.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 font-mono mb-1 uppercase">STOCK LEVEL</label>
                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-hidden text-slate-700 font-mono"
                    >
                      <option value="all">Any Status</option>
                      <option value="instock">In Stock (Any)</option>
                      <option value="Full Shelf">Full Shelf</option>
                      <option value="High">High Stock</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low Stock</option>
                      <option value="Out of Stock">Empty / Out of Stock</option>
                    </select>
                  </div>
                </div>

                {/* Distance Slider */}
                <div className="pt-1.5 flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Compass className="h-3 w-3 text-indigo-500 animate-spin-slow" />
                      LOCATION RADIANTS (MILES)
                    </span>
                    <span className="text-indigo-600 font-bold">{maxDistance === 50 ? 'Unlimited' : `${maxDistance} miles`}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Quick Filters reset */}
                {(searchQuery || flavorFilter !== 'all' || categoryFilter !== 'all' || stockFilter !== 'all' || maxDistance !== 25) && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-all self-start"
                  >
                    Clear Filter Radiuses & Options
                  </button>
                )}
              </div>

              {/* SPOTTED LISTINGS RENDER */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredSpottings.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-3 font-sans">
                    <div className="text-3xl font-mono">🔍❌</div>
                    <p className="font-semibold text-slate-700 text-sm">No rare soda spottings found</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Try adjusting your search filters or range distance, or report a first-hand spotting around you!
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  filteredSpottings.map((spot) => {
                    const isSelected = selectedSpotting?.id === spot.id;
                    const dist = calculateDistance(userLocation.latitude, userLocation.longitude, spot.latitude, spot.longitude);
                    const isMelloYello = spot.flavorId === 'mello-yello-zero';

                    // Level background indicators
                    const levelColors = {
                      'Full Shelf': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      'High': 'bg-teal-50 text-teal-700 border-teal-200',
                      'Medium': 'bg-amber-50 text-amber-700 border-amber-200',
                      'Low': 'bg-orange-50 text-orange-700 border-orange-200',
                      'Out of Stock': 'bg-rose-50 text-rose-700 border-rose-200',
                    }[spot.stockLevel];

                    return (
                      <div
                        key={spot.id}
                        onClick={() => setSelectedSpotting(spot)}
                        className={`p-4 text-left transition-all cursor-pointer font-sans select-none relative ${
                          isSelected 
                            ? 'bg-indigo-50/40 border-l-4 border-indigo-600' 
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {isMelloYello && (
                          <span className="absolute right-4 top-4 text-xs font-mono font-bold bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded-sm shadow-xs animate-bounce animate-once">
                            👑 Seekers Choice
                          </span>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                            {spot.brand} &bull; {spot.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1">
                            📍 {dist.toFixed(1)} mi
                          </span>
                        </div>

                        <h4 className="font-sans font-bold text-slate-900 text-[15px] mt-1 pr-16 leading-snug">
                          {spot.flavorName}
                        </h4>

                        <div className="flex items-center gap-1.5 mt-2">
                          <Store className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs text-slate-700 font-semibold">{spot.storeName}</span>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1 pl-5">
                          {spot.storeAddress}
                        </p>

                        <div className="flex items-center justify-between mt-3 font-sans">
                          {/* Stock & Size pills */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${levelColors}`}>
                              {spot.stockLevel}
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded text-[11px] font-bold flex items-center gap-1">
                              <span>📦</span> {spot.size}
                            </span>
                            {spot.price && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold">
                                ${spot.price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Quick statistics */}
                          <div className="flex items-center gap-2.5 text-slate-400 text-[11px] font-semibold font-mono">
                            <span className="text-emerald-600">👍 {spot.confirmations} OK</span>
                            <span className="text-rose-600">👎 {spot.denials} EMPTY</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* LEADERBOARD TAB VIEW */}
          {activeTab === 'leaderboard' && (
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              <Leaderboard 
                finders={finders} 
                onRefresh={handleRefreshRankings} 
                isRefreshing={isRefreshingRankings} 
              />
            </div>
          )}

          {/* PREMIUM ALERTS TAB VIEW */}
          {activeTab === 'premium' && (
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              <PremiumPushSimulator
                userLocation={userLocation}
                setUserLocation={setUserLocation}
                spottings={spottings}
                isPremium={isPremium}
                setIsPremium={setIsPremium}
                onSelectSpotting={(spot) => {
                  setSelectedSpotting(spot);
                  setActiveTab('listings');
                }}
              />
            </div>
          )}

          {/* ADMIN CONSOLE VIEW */}
          {activeTab === 'admin' && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
              <AdminPanel
                isAdminActive={isAdminActive}
                setIsAdminActive={setIsAdminActive}
                spottings={spottings}
                onUpdateSpottings={saveSpottingsToStorage}
                onAddCustomFlavor={handleAddCustomFlavor}
                customFlavors={customFlavors}
                onTriggerAlert={(title, body) => {
                  setGlobalAnnouncement({ title, body });
                }}
              />
            </div>
          )}

          {/* Sidebar Privacy Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-none">
            <span>&copy; 2026 FizzFinder</span>
            <button
              type="button"
              id="open-privacy-btn"
              onClick={() => setIsPrivacyOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Shield className="h-3.5 w-3.5" />
              Privacy Policy
            </button>
          </div>

        </section>


        {/* RIGHT COMPONENT CANVAS (Live Map and Reporting / Feedback panels) */}
        <section className="lg:w-7/12 xl:w-8/12 flex flex-col h-full gap-5">
          
          {/* MAP WRAPPER PORTION */}
          <div className="flex-1 relative z-10">
            <FizzMap
              spottings={filteredSpottings}
              selectedSpotting={selectedSpotting}
              onSelectSpotting={setSelectedSpotting}
              userLocation={userLocation}
              reportingMode={reportingModeActive}
              onSelectReportLocation={handleCoordinatesSelectedFromMap}
            />

            {/* Float form trigger overlay when map coords waiting */}
            {mapSelectedCoords && !isReporting && (
              <div className="absolute top-16 left-4 right-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-indigo-200 animate-slide-down flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📍</span>
                  <div>
                    <h5 className="font-bold text-slate-900 leading-tight">Coordinates ready for report!</h5>
                    <p className="text-slate-500 font-semibold font-sans mt-0.5 max-w-sm truncate">{mapSelectedCoords.address}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setIsReporting(true);
                      setSelectedSpotting(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    Open Form
                  </button>
                  <button
                    onClick={() => setMapSelectedCoords(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer font-bold"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE SPOTTED FORM OVERLAY (Shows when reporting is active) */}
          {isReporting && (
            <div className="flex-none bg-white rounded-2xl border border-slate-100 p-1 animate-fade-in-up shadow-sm">
              <ReportForm
                mapSelectedCoords={mapSelectedCoords}
                onSubmit={handleAddSpottedSoda}
                onCancel={() => {
                  setIsReporting(false);
                  setReportingModeActive(false);
                  setMapSelectedCoords(null);
                }}
                onTriggerMapPick={handleMapLocationPick}
                reportingMode={reportingModeActive}
                availableFlavors={allAvailableFlavors}
                currentUserDisplayName={currentUser?.displayName}
              />
            </div>
          )}

          {/* SELECTED SPOTTING DETAILS PANEL (Shows upvote logs and comments list in real-time) */}
          {selectedSpotting && !isReporting && (
            <div className="flex-none bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in-up text-left font-sans">
              
              {/* Card top banner details */}
              <div className="flex items-start justify-between border-b pb-3 border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-widest">
                      {selectedSpotting.brand} &bull; {selectedSpotting.category}
                    </span>
                    {selectedSpotting.price && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        ${selectedSpotting.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-sans font-black text-slate-900 text-lg leading-snug mt-1 flex items-center gap-2">
                    {selectedSpotting.flavorName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[11px] font-bold bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-indigo-150 shadow-2xs">
                      <span>📦</span> Size: {selectedSpotting.size}
                    </span>
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                      📊 Stock: {selectedSpotting.stockLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-2 font-sans flex items-center gap-1">
                    📍 {selectedSpotting.storeName} ({selectedSpotting.storeAddress})
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Rating Stars */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-amber-400">
                      ★
                    </span>
                  ))}
                  <span className="text-xs text-slate-500 font-bold font-mono ml-1">
                    ({selectedSpotting.storeRating.toFixed(1)})
                  </span>
                </div>
              </div>

              {/* Vote Drivers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-secondary">
                
                {/* Visual verification counts */}
                <div className="flex flex-col gap-1 text-slate-600">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Original Lister: <span className="text-indigo-600">{selectedSpotting.reportedBy}</span> (Rep {selectedSpotting.reportedByReputation})
                    </span>
                    <span className="text-slate-400">{selectedSpotting.reportedTime}</span>
                  </div>
                  
                  <div className="mt-2 text-xs leading-relaxed text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <strong className="text-slate-700">Stock Status Reported:</strong> {selectedSpotting.stockLevel}. Help fellow soda collectors by upvoting if the shelf matches or flagging if it is sold out!
                  </div>
                </div>

                {/* Vote Drivers */}
                <div className="flex flex-col justify-center gap-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider text-center md:text-left">
                    IS THIS ITEM STILL ON THE SHELF?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVote(selectedSpotting.id, 'confirm')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSpotting.userVoted === 'confirm'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-97'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4 fill-current" />
                      Spotted! Confirm ({selectedSpotting.confirmations})
                    </button>
                    <button
                      onClick={() => handleVote(selectedSpotting.id, 'deny')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSpotting.userVoted === 'deny'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-97'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4 fill-current" />
                      Not There! Deny ({selectedSpotting.denials})
                    </button>
                  </div>
                </div>

              </div>

              {/* Dynamic Google AdMob / AdSense banner for detailed view standard users */}
              {!isPremium && (
                <div className="py-2.5">
                  <AdBanner isPremium={isPremium} position="details" />
                </div>
              )}

              {/* Comments list / Spottings comments module */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 font-mono tracking-wider">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  SHELF UPDATES & CHAT LOGS ({selectedComments.length})
                </div>

                {/* Comments box */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2">
                  {selectedComments.length === 0 ? (
                    <p className="text-slate-400 text-xs italic font-sans py-2">
                      No additional shelf comments on this store yet. Be the first to add an update!
                    </p>
                  ) : (
                    selectedComments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 font-sans">{comment.username}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{comment.time}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-sans">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Add widget */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter nickname..."
                    value={userNickname}
                    onChange={(e) => setUserNickname(e.target.value)}
                    className="w-2/12 xs:w-3/12 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-mono"
                    title="Your display name"
                  />
                  <input
                    type="text"
                    placeholder="Write a quick shelf update (e.g. 'Only 3 left!', 'New supply just loaded')..."
                    required
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer select-none"
                  >
                    Post Log
                  </button>
                </form>
              </div>

            </div>
          )}

        </section>

      </main>

      {isPrivacyOpen && (
        <PrivacyPolicy onClose={() => setIsPrivacyOpen(false)} />
      )}

    </div>
  );
}
