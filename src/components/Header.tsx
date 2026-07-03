import React, { useState, useEffect } from 'react';
import { Car, Bell, User, LogOut, Shield, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PushNotification } from '../types';
import logoPelletierA from '../logoPelletierA.png';

interface HeaderProps {
  isAdmin: boolean;
  onAdminLoginClick: () => void;
  onAdminLogout: () => void;
  notifications: PushNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onClearNotifications: () => void;
  isSubscribed: boolean;
  onToggleSubscription: () => void;
  onNavigateToSection: (section: 'browse' | 'contact' | 'admin' | 'transactions') => void;
  currentSection: string;
}

export default function Header({
  isAdmin,
  onAdminLoginClick,
  onAdminLogout,
  notifications,
  onMarkNotificationAsRead,
  onClearNotifications,
  isSubscribed,
  onToggleSubscription,
  onNavigateToSection,
  currentSection,
}: HeaderProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Detect 'admin' in the URL to show/hide admin portal access
  useEffect(() => {
    const checkUrlForAdmin = () => {
      const url = window.location.href.toLowerCase();
      setShowAdminAccess(url.includes('admin'));
    };

    // Initial check
    checkUrlForAdmin();

    // Listen to changes in URL
    window.addEventListener('hashchange', checkUrlForAdmin);
    window.addEventListener('popstate', checkUrlForAdmin);

    // Also run a small interval check for SPAs or dynamic updates if any
    const interval = setInterval(checkUrlForAdmin, 1000);

    return () => {
      window.removeEventListener('hashchange', checkUrlForAdmin);
      window.removeEventListener('popstate', checkUrlForAdmin);
      clearInterval(interval);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#notif-dropdown') && !target.closest('#notif-bell')) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div 
          className="flex cursor-pointer items-center"
          onClick={() => onNavigateToSection('browse')}
        >
          <img 
            src={logoPelletierA} 
            alt="Pelletier Automobile" 
            className="h-14 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center space-x-8">
          <button
            onClick={() => onNavigateToSection('browse')}
            className={`text-sm font-medium transition-colors duration-200 ${
              currentSection === 'browse' && !isAdmin
                ? 'text-gray-900 font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Nos Véhicules
          </button>
          
          {isAdmin ? (
            <>
              <button
                onClick={() => onNavigateToSection('admin')}
                className={`text-sm font-medium transition-colors duration-200 ${
                  currentSection === 'admin'
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Gestion Stock
              </button>
              <button
                onClick={() => onNavigateToSection('transactions')}
                className={`text-sm font-medium transition-colors duration-200 ${
                  currentSection === 'transactions'
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Ventes & Historique
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                const element = document.getElementById('footer-contact');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Contact
            </button>
          )}
        </nav>

        {/* Actions (Notif & Admin portal) */}
        <div className="flex items-center space-x-4">
          
          {/* Push notification bell */}
          <div className="relative">
            <button
              id="notif-bell"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-gray-600 transition hover:bg-gray-100 focus:outline-none"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  id="notif-dropdown"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl ring-1 ring-black/5"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-gray-50 pb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={onToggleSubscription}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          isSubscribed
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {isSubscribed ? 'Abonné (Push)' : "S'abonner"}
                      </button>
                      {notifications.length > 0 && (
                        <button
                          onClick={onClearNotifications}
                          className="text-[11px] text-gray-400 hover:text-gray-900 transition"
                        >
                          Effacer tout
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">
                        Aucune notification pour le moment.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => onMarkNotificationAsRead(notif.id)}
                          className={`group relative flex flex-col rounded-xl p-3 text-xs transition cursor-pointer border ${
                            notif.read
                              ? 'bg-white border-gray-50 text-gray-500'
                              : 'bg-red-50/40 border-red-50/80 text-gray-800 font-medium'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-gray-900">{notif.title}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(notif.time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-600 leading-relaxed pr-4">{notif.message}</p>
                          {!notif.read && (
                            <span className="absolute right-3 bottom-3 h-1.5 w-1.5 rounded-full bg-red-600" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {!isSubscribed && (
                    <div className="mt-3 border-t border-gray-50 pt-3 text-center">
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Abonnez-vous pour recevoir les offres en temps réel !
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin Account Section */}
          {isAdmin ? (
            <div className="flex items-center space-x-2">
              <div className="hidden lg:flex flex-col items-end mr-1">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                  <Shield className="h-3 w-3" /> Admin
                </span>
                <span className="text-[10px] text-gray-400">Gérant de luxe</span>
              </div>
              <button
                onClick={onAdminLogout}
                className="flex items-center justify-center h-10 w-10 lg:w-auto lg:px-4 lg:space-x-2 rounded-full lg:rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 font-medium text-sm focus:outline-none"
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline text-xs">Déconnexion</span>
              </button>
            </div>
          ) : showAdminAccess ? (
            <button
              onClick={onAdminLoginClick}
              className="flex items-center space-x-1 sm:space-x-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-sm font-medium transition shadow-sm animate-pulse"
              title="Portail Administrateur Pelletier Automobile"
            >
              <User className="h-4 w-4" />
              <span>Espace Admin</span>
            </button>
          ) : null}

        </div>
      </div>
    </header>
  );
}
