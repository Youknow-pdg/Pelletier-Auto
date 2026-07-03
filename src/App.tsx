import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, Bell, Shield, Phone, Mail, MapPin, Clock, ArrowUp, Star, CreditCard, Sparkles, MessageSquareHeart 
} from 'lucide-react';

import { Vehicle, Transaction, PushNotification } from './types';
import { INITIAL_VEHICLES } from './mockData';
import logoPelletierA from './logoPelletierA.png';
import { 
  getSupabaseVehicles, 
  getSupabaseTransactions, 
  getSupabaseNotifications, 
  upsertSupabaseVehicle, 
  deleteSupabaseVehicle, 
  insertSupabaseTransaction, 
  upsertSupabaseNotification 
} from './lib/supabase';

// Import our custom components
import Header from './components/Header';
import Hero from './components/Hero';
import Filters from './components/Filters';
import VehicleCard from './components/VehicleCard';
import VehicleModal from './components/VehicleModal';
import CheckoutModal from './components/CheckoutModal';
import LoginModal from './components/LoginModal';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // --- STATE ---
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSection, setCurrentSection] = useState<'browse' | 'admin' | 'transactions'>('browse');

  // Active Modals state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [checkoutVehicle, setCheckoutVehicle] = useState<Vehicle | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Active Toast Notification state (floating push card)
  const [activeToast, setActiveToast] = useState<PushNotification | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [sortBy, setSortBy] = useState('recent');

  // --- INITIALIZATION (Supabase & LocalStorage) ---
  useEffect(() => {
    async function loadInitialData() {
      // 1. Load Vehicles from Supabase
      const sbVehicles = await getSupabaseVehicles();
      if (sbVehicles !== null) {
        if (sbVehicles.length > 0) {
          setVehicles(sbVehicles);
          localStorage.setItem('luxe_auto_vehicles', JSON.stringify(sbVehicles));
        } else {
          // Supabase is connected but empty, seed with initial data
          setVehicles(INITIAL_VEHICLES);
          localStorage.setItem('luxe_auto_vehicles', JSON.stringify(INITIAL_VEHICLES));
          for (const v of INITIAL_VEHICLES) {
            await upsertSupabaseVehicle(v);
          }
        }
      } else {
        // Fallback to local storage
        const storedVehicles = localStorage.getItem('luxe_auto_vehicles');
        if (storedVehicles) {
          setVehicles(JSON.parse(storedVehicles));
        } else {
          setVehicles(INITIAL_VEHICLES);
          localStorage.setItem('luxe_auto_vehicles', JSON.stringify(INITIAL_VEHICLES));
        }
      }

      // 2. Load Transactions from Supabase
      const sbTransactions = await getSupabaseTransactions();
      const defaultTx: Transaction = {
        id: 'TX-489215',
        vehicleId: 'car-6',
        vehicleBrand: 'Mercedes-Benz',
        vehicleModel: 'AMG GT C Coupé',
        price: 118000,
        buyerName: 'Sébastien Loeb',
        buyerEmail: 'seb.loeb@rallye.fr',
        buyerPhone: '+33 6 88 12 34 56',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'Carte Bancaire',
        cardNumber: '4392',
        status: 'success',
      };

      if (sbTransactions !== null) {
        if (sbTransactions.length > 0) {
          setTransactions(sbTransactions);
          localStorage.setItem('luxe_auto_transactions', JSON.stringify(sbTransactions));
        } else {
          setTransactions([defaultTx]);
          localStorage.setItem('luxe_auto_transactions', JSON.stringify([defaultTx]));
          await insertSupabaseTransaction(defaultTx);
        }
      } else {
        // Fallback to local storage
        const storedTransactions = localStorage.getItem('luxe_auto_transactions');
        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        } else {
          setTransactions([defaultTx]);
          localStorage.setItem('luxe_auto_transactions', JSON.stringify([defaultTx]));
        }
      }

      // 3. Load Notifications from Supabase
      const sbNotifs = await getSupabaseNotifications();
      const defaultNotifs: PushNotification[] = [
        {
          id: 'notif-welcome',
          title: 'Bienvenue chez Pelletier Automobile !',
          message: 'Explorez notre catalogue de prestige et effectuez votre achat en ligne sécurisé en quelques clics.',
          time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          type: 'system',
        },
        {
          id: 'notif-new-porsche',
          title: 'Disponibilité Exceptionnelle',
          message: 'Une sublime Porsche 911 Carrera S de 2022 vient d\'arriver dans notre stock. Premier arrivé, premier servi !',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          type: 'new_listing',
        }
      ];

      if (sbNotifs !== null) {
        if (sbNotifs.length > 0) {
          setNotifications(sbNotifs);
          localStorage.setItem('luxe_auto_notifications', JSON.stringify(sbNotifs));
        } else {
          setNotifications(defaultNotifs);
          localStorage.setItem('luxe_auto_notifications', JSON.stringify(defaultNotifs));
          for (const n of defaultNotifs) {
            await upsertSupabaseNotification(n);
          }
        }
      } else {
        // Fallback to local storage
        const storedNotifs = localStorage.getItem('luxe_auto_notifications');
        if (storedNotifs) {
          setNotifications(JSON.parse(storedNotifs));
        } else {
          setNotifications(defaultNotifs);
          localStorage.setItem('luxe_auto_notifications', JSON.stringify(defaultNotifs));
        }
      }
    }

    loadInitialData();

    // 4. Load Subscription state
    const storedSub = localStorage.getItem('luxe_auto_subscribed');
    if (storedSub) {
      setIsSubscribed(JSON.parse(storedSub));
    }
  }, []);

  // Sync helpers (saving to state & localStorage backup)
  const saveVehicles = (updated: Vehicle[]) => {
    setVehicles(updated);
    localStorage.setItem('luxe_auto_vehicles', JSON.stringify(updated));
  };

  const saveTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    localStorage.setItem('luxe_auto_transactions', JSON.stringify(updated));
  };

  const saveNotifications = (updated: PushNotification[]) => {
    setNotifications(updated);
    localStorage.setItem('luxe_auto_notifications', JSON.stringify(updated));
    
    // Auto-upsert changed notifications to Supabase in background
    if (updated.length > 0) {
      // Upsert the most recent notification that was added
      upsertSupabaseNotification(updated[0]).catch(e => console.warn('Supabase notification sync skipped:', e));
    }
  };

  // --- FLOATING PUSH TOAST CONTROLLER ---
  const triggerToast = (notif: PushNotification) => {
    setActiveToast(notif);
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setActiveToast((prev) => (prev?.id === notif.id ? null : prev));
    }, 6000);
  };

  // --- ACTIONS & HANDLERS ---

  // Subscribe/Unsubscribe to push alerts
  const handleToggleSubscription = () => {
    const nextSub = !isSubscribed;
    setIsSubscribed(nextSub);
    localStorage.setItem('luxe_auto_subscribed', JSON.stringify(nextSub));

    if (nextSub) {
      const welcomeAlert: PushNotification = {
        id: `sub-alert-${Date.now()}`,
        title: '🔔 Alertes Actives !',
        message: 'Vous recevrez désormais des alertes push instantanées lors de l\'ajout de nouveaux véhicules.',
        time: new Date().toISOString(),
        read: false,
        type: 'system',
      };
      // Save and trigger toast immediately
      const updated = [welcomeAlert, ...notifications];
      saveNotifications(updated);
      triggerToast(welcomeAlert);
    }
  };

  // Mark specific notification as read
  const handleMarkNotificationAsRead = (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (target) {
      upsertSupabaseNotification({ ...target, read: true }).catch((e) =>
        console.warn('Supabase notification read status sync skipped:', e)
      );
    }
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  // Clear all notifications
  const handleClearNotifications = () => {
    saveNotifications([]);
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setCurrentSection('browse');
    
    // Simple farewell notification
    const logoutNotif: PushNotification = {
      id: `logout-${Date.now()}`,
      title: 'Déconnexion réussie',
      message: 'Session administrative fermée.',
      time: new Date().toISOString(),
      read: true,
      type: 'system',
    };
    saveNotifications([logoutNotif, ...notifications]);
  };

  // Admin CRUD: Add listing
  const handleAddVehicle = (newCarData: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const newCar: Vehicle = {
      ...newCarData,
      id: `car-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newCar, ...vehicles];
    saveVehicles(updatedList);

    // Write to Supabase
    upsertSupabaseVehicle(newCar).catch(e => console.warn('Supabase add vehicle skipped:', e));

    // Create and broadcast Push Notification
    const newListingNotif: PushNotification = {
      id: `notif-car-${newCar.id}`,
      title: '🆕 Arrivage Prestige !',
      message: `La nouvelle ${newCar.brand || ''} ${newCar.model || ''} est disponible au showroom ! Cliquez pour découvrir.`,
      time: new Date().toISOString(),
      read: false,
      type: 'new_listing',
      vehicleId: newCar.id,
    };

    saveNotifications([newListingNotif, ...notifications]);

    // Trigger push toast to client if they are subscribed
    if (isSubscribed) {
      triggerToast(newListingNotif);
    }
  };

  // Admin CRUD: Edit listing
  const handleEditVehicle = (id: string, updatedFields: Partial<Vehicle>) => {
    const updatedList = vehicles.map((v) => (v.id === id ? { ...v, ...updatedFields } : v));
    saveVehicles(updatedList);

    // Sync edited vehicle to Supabase
    const updatedCar = updatedList.find(v => v.id === id);
    if (updatedCar) {
      upsertSupabaseVehicle(updatedCar).catch(e => console.warn('Supabase edit vehicle skipped:', e));
    }

    // If we updated the price, let's trigger a promo push notification!
    const originalCar = vehicles.find(v => v.id === id);
    if (originalCar && updatedFields.price !== undefined && updatedFields.price < (originalCar.price || 0)) {
      const discountNotif: PushNotification = {
        id: `promo-${id}-${Date.now()}`,
        title: '📉 Baisse de Prix !',
        message: `Bonne nouvelle ! Le prix de la ${originalCar.brand || ''} ${originalCar.model || ''} vient d'être réduit à ${(updatedFields.price).toLocaleString('fr-FR')} €.`,
        time: new Date().toISOString(),
        read: false,
        type: 'promo',
        vehicleId: id,
      };
      saveNotifications([discountNotif, ...notifications]);
      if (isSubscribed) {
        triggerToast(discountNotif);
      }
    }
  };

  // Admin CRUD: Delete listing
  const handleDeleteVehicle = (id: string) => {
    const updatedList = vehicles.filter((v) => v.id !== id);
    saveVehicles(updatedList);

    // Sync deletion to Supabase
    deleteSupabaseVehicle(id).catch(e => console.warn('Supabase delete vehicle skipped:', e));
  };

  // Admin manual push notification broadcast
  const handleSendManualPush = (title: string, message: string) => {
    const customNotif: PushNotification = {
      id: `custom-broadcast-${Date.now()}`,
      title,
      message,
      time: new Date().toISOString(),
      read: false,
      type: 'promo',
    };

    saveNotifications([customNotif, ...notifications]);

    // Force trigger toast for demonstration, since admin pushed it explicitly
    triggerToast(customNotif);
  };

  // Client checkout completion
  const handlePaymentSuccess = (
    buyerName: string,
    buyerEmail: string,
    buyerPhone: string,
    paymentMethod: string,
    cardNumber: string
  ) => {
    if (!checkoutVehicle) return;

    // 1. Mark car as sold in database
    const updatedVehicles = vehicles.map((v) =>
      v.id === checkoutVehicle.id ? { ...v, status: 'sold' as const } : v
    );
    saveVehicles(updatedVehicles);

    // Sync sold status to Supabase
    const soldCar = updatedVehicles.find(v => v.id === checkoutVehicle.id);
    if (soldCar) {
      upsertSupabaseVehicle(soldCar).catch(e => console.warn('Supabase mark sold vehicle skipped:', e));
    }

    // 2. Generate and append sale Transaction
    const newTx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleId: checkoutVehicle.id,
      vehicleBrand: checkoutVehicle.brand,
      vehicleModel: checkoutVehicle.model,
      price: checkoutVehicle.price || 0,
      buyerName,
      buyerEmail,
      buyerPhone,
      date: new Date().toISOString(),
      paymentMethod,
      cardNumber,
      status: 'success',
    };

    saveTransactions([newTx, ...transactions]);

    // Insert transaction into Supabase
    insertSupabaseTransaction(newTx).catch(e => console.warn('Supabase insert transaction skipped:', e));

    // 3. Send admin log notification
    const saleNotif: PushNotification = {
      id: `sale-alert-${Date.now()}`,
      title: '🎉 Félicitations pour votre achat !',
      message: `Votre commande pour la ${checkoutVehicle.brand || ''} ${checkoutVehicle.model || ''} a été validée. Référence : ${newTx.id}.`,
      time: new Date().toISOString(),
      read: false,
      type: 'sale',
    };
    saveNotifications([saleNotif, ...notifications]);
    
    if (isSubscribed) {
      triggerToast(saleNotif);
    }
  };

  // --- live background offer simulator ---
  useEffect(() => {
    // We schedule a nice promotional alert after 25 seconds of session for high engagement
    const simTimer = setTimeout(() => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === 'simulated-offer-flash')) {
          return prev;
        }

        const simulatedAlert: PushNotification = {
          id: 'simulated-offer-flash',
          title: '🔥 Offre Privée Pelletier Automobile',
          message: 'Sélection Exclusive : Financement exceptionnel à 0.9% sur tous les véhicules électriques ce week-end !',
          time: new Date().toISOString(),
          read: false,
          type: 'promo',
        };

        const updated = [simulatedAlert, ...prev];
        localStorage.setItem('luxe_auto_notifications', JSON.stringify(updated));

        if (isSubscribed) {
          triggerToast(simulatedAlert);
        }

        return updated;
      });
    }, 25000);

    return () => clearTimeout(simTimer);
  }, [isSubscribed]);

  // --- FILTERING LOGIC ---
  const highestPrice = vehicles.length > 0 
    ? Math.max(...vehicles.map((v) => v.price || 0)) 
    : 150000;

  // Filter list
  const filteredVehicles = vehicles.filter((v) => {
    const titleMatch = [v.brand, v.model].join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    const brandMatch = !selectedBrand || v.brand === selectedBrand;
    const fuelMatch = !selectedFuel || v.fuel === selectedFuel;
    const transmissionMatch = !selectedTransmission || v.transmission === selectedTransmission;
    const priceMatch = v.price === undefined || v.price <= maxPrice;

    return titleMatch && brandMatch && fuelMatch && transmissionMatch && priceMatch;
  });

  // Sorting logic
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'year_desc') return (b.year || 0) - (a.year || 0);
    if (sortBy === 'mileage_asc') return (a.mileage || 0) - (b.mileage || 0);
    // Default 'recent': newest date first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('');
    setSelectedFuel('');
    setSelectedTransmission('');
    setMaxPrice(highestPrice);
    setSortBy('recent');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased selection:bg-gray-900 selection:text-white">
      
      {/* HEADER SECTION */}
      <Header
        isAdmin={isAdmin}
        onAdminLoginClick={() => setIsLoginOpen(true)}
        onAdminLogout={handleAdminLogout}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onClearNotifications={handleClearNotifications}
        isSubscribed={isSubscribed}
        onToggleSubscription={handleToggleSubscription}
        onNavigateToSection={(sec) => {
          if (sec === 'browse') {
            setCurrentSection('browse');
          } else if (isAdmin) {
            setCurrentSection(sec as any);
          } else {
            setIsLoginOpen(true);
          }
        }}
        currentSection={currentSection}
      />

      {/* FLOATING ACTION OVERLAY PUSH TOAST (Slide-in alert) */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-2xl backdrop-blur-md ring-1 ring-black/5"
          >
            <div className="flex items-start space-x-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
                <Car className="h-5 w-5 animate-bounce" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alerte Push • Pelletier Automobile</span>
                  <button 
                    onClick={() => setActiveToast(null)} 
                    className="text-gray-400 hover:text-gray-900 transition p-0.5 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h4 className="text-xs font-extrabold text-gray-900">{activeToast.title}</h4>
                <p className="text-[11px] text-gray-600 leading-relaxed">{activeToast.message}</p>
                {activeToast.vehicleId && (
                  <button
                    onClick={() => {
                      const matched = vehicles.find((v) => v.id === activeToast.vehicleId);
                      if (matched) {
                        setSelectedVehicle(matched);
                        setActiveToast(null);
                      }
                    }}
                    className="mt-1.5 text-[10px] font-extrabold text-red-600 hover:text-red-700 transition flex items-center gap-1"
                  >
                    Consulter la fiche technique →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN VIEW CONTENT ENGINE */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          
          {/* CLIENT VIEW: Showroom Show */}
          {currentSection === 'browse' ? (
            <motion.div
              key="browse-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Hero onSearchClick={() => {
                const element = document.getElementById('filters-anchor');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }} />

              {/* Showroom Anchor and Filter bar */}
              <div id="filters-anchor" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-baseline gap-2">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Showroom Prestige</h2>
                    <p className="text-xs text-gray-500">Filtrage en temps réel. Aucun compte requis pour réserver.</p>
                  </div>
                  <p className="text-xs font-bold text-gray-400">
                    {sortedVehicles.length} véhicule{sortedVehicles.length > 1 ? 's' : ''} disponible{sortedVehicles.length > 1 ? 's' : ''}
                  </p>
                </div>

                <Filters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedBrand={selectedBrand}
                  onBrandChange={setSelectedBrand}
                  selectedFuel={selectedFuel}
                  onFuelChange={setSelectedFuel}
                  selectedTransmission={selectedTransmission}
                  onTransmissionChange={setSelectedTransmission}
                  maxPrice={maxPrice}
                  onMaxPriceChange={setMaxPrice}
                  highestPriceInStock={highestPrice}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  onResetFilters={handleResetFilters}
                />

                {/* Vehicles Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence mode="popLayout">
                    {sortedVehicles.map((vehicle) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onViewDetails={(v) => setSelectedVehicle(v)}
                        onBuyClick={(v) => setCheckoutVehicle(v)}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Empty State placeholder */}
                {sortedVehicles.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 text-center space-y-4 max-w-md mx-auto"
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                      <Car className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-gray-900">Aucun véhicule trouvé</h3>
                      <p className="text-xs text-gray-500">Ajustez vos filtres de prix, de modèle ou de marque pour élargir la recherche.</p>
                    </div>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition"
                    >
                      Réinitialiser tous les filtres
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            // ADMIN VIEW: Portal console (strictly protected)
            <motion.div
              key="admin-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isAdmin ? (
                <AdminPanel
                  vehicles={vehicles}
                  transactions={transactions}
                  onAddVehicle={handleAddVehicle}
                  onEditVehicle={handleEditVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                  onSendPushNotification={handleSendManualPush}
                  currentSection={currentSection as 'admin' | 'transactions'}
                  onNavigateToSection={(sec) => setCurrentSection(sec as any)}
                />
              ) : (
                // Safe Fallback locked screen
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <Shield className="h-12 w-12 text-red-500 animate-bounce" />
                  <h3 className="text-lg font-bold text-gray-900">Portail Administratif Sécurisé</h3>
                  <p className="text-xs text-gray-500 max-w-xs">Vous devez vous authentifier pour accéder à cette interface.</p>
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm transition font-medium"
                  >
                    S'authentifier
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER SECTION */}
      <footer id="footer-contact" className="bg-gray-950 text-white border-t border-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            
            {/* Description Col */}
            <div className="space-y-4">
              <div className="flex items-center">
                <img 
                  src={logoPelletierA} 
                  alt="Pelletier Automobile" 
                  className="h-12 w-auto object-contain bg-white/95 rounded-xl p-1.5"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Showroom automobile indépendant d'exception. Nous mettons en relation l'excellence technique et le goût du prestige pour vous proposer des acquisitions d'exception.
              </p>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3 w-3 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-[10px] text-gray-400 ml-1">4.9/5 satisfaction client</span>
              </div>
            </div>

            {/* Hours Col */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Horaires Showroom</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex justify-between">
                  <span>Lundi - Vendredi :</span>
                  <span className="text-white font-semibold">9h00 - 19h00</span>
                </li>
                <li className="flex justify-between">
                  <span>Samedi :</span>
                  <span className="text-white font-semibold">10h00 - 18h00</span>
                </li>
                <li className="flex justify-between">
                  <span>Dimanche :</span>
                  <span className="text-red-400 italic">Fermé (Sur RDV)</span>
                </li>
              </ul>
            </div>

            {/* Contact Info Col */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Nous Contacter</h4>
              <ul className="space-y-3 text-xs text-gray-400">
                <li className="flex items-start space-x-2.5">
                  <MapPin className="h-4.5 w-4.5 text-gray-500 shrink-0 mt-0.5" />
                  <span>1740 Av. du Languedoc, 66000 Perpignan</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Phone className="h-4.5 w-4.5 text-gray-500" />
                  <span>+33 6 42 91 47 10</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Mail className="h-4.5 w-4.5 text-gray-500" />
                  <span>contact@pelletier-automobile.com</span>
                </li>
              </ul>
            </div>

            {/* Quick Secure Checkout notes */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Acquisition Digitale</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Achetez votre véhicule de n'importe où. Notre système de transactions chiffré garantit un règlement 100% sécurisé et une livraison directement chez vous sous 48 heures.
              </p>
              <div className="flex items-center space-x-3.5 pt-1 text-gray-500">
                <CreditCard className="h-6 w-8 text-white/40" />
                <span className="text-[10px] font-bold text-gray-500 tracking-wider">🔒 CHIFFREMENT SSL 256 BITS</span>
              </div>
            </div>

          </div>

          <div className="mt-12 border-t border-gray-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
            <p>© 2026 Pelletier Automobile SAS. Tous droits réservés. Mentions légales.</p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition">Conditions de Vente</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition">Politique RGPD</a>
              <span>•</span>
              <button 
                onClick={() => setIsLoginOpen(true)} 
                className="hover:text-white font-bold text-gray-400 transition"
              >
                Accès Admin
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* --- ALL MODALS INTEGRATIONS --- */}

      {/* 1. Vehicle Detail Modal */}
      <VehicleModal
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onBuyClick={(v) => setCheckoutVehicle(v)}
        isAdmin={isAdmin}
        onEditClick={(v) => {
          setCurrentSection('admin');
          // Give tiny delay to trigger openForm inside AdminPanel or coordinate directly
          setTimeout(() => {
            const formBtn = document.querySelector('[title="Modifier"]') as HTMLButtonElement;
            if (formBtn) formBtn.click();
          }, 150);
        }}
      />

      {/* 2. Integrated Secure Checkout Modal */}
      <CheckoutModal
        vehicle={checkoutVehicle}
        onClose={() => setCheckoutVehicle(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 3. Secure Admin Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => {
          setIsAdmin(true);
          setCurrentSection('admin');
        }}
      />

    </div>
  );
}

// Inline SVG close icon helper
function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
