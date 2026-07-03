import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface HeroProps {
  onSearchClick: () => void;
}

export default function Hero({ onSearchClick }: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-gray-50 border-b border-gray-100">
      
      {/* Background car image with soft gradient masking to ensure readability across all devices (mobile, tablet, desktop) */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.25] md:opacity-[0.20] transition-opacity duration-300"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/25 pointer-events-none" />
      
      {/* Decorative ambient blobs */}
      <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-red-100/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-rose-100/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 rounded-full border border-gray-200/80 bg-white px-3 py-1 text-xs font-medium text-gray-800 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-red-500 fill-red-500" />
              <span>La Sélection d'Exception Pelletier Automobile</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight"
            >
              Trouvez le véhicule <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-black">
                qui vous ressemble
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-600 max-w-xl leading-relaxed"
            >
              Découvrez notre showroom de véhicules haut de gamme rigoureusement sélectionnés. 
              Profitez d'un processus d'achat fluide, d'une assistance premium, et du paiement 
              sécurisé en ligne. Sans engagement ni création de compte obligatoire.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={onSearchClick}
                className="group inline-flex items-center justify-center space-x-2 rounded-xl bg-gray-900 px-6 py-4 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800 hover:shadow-lg focus:outline-none"
              >
                <span>Explorer le Showroom</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              
              <div className="flex items-center space-x-4 px-2 py-1 text-xs text-gray-500">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-gray-700">Sécurité Totale</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center space-x-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-gray-700">Achat en 5 Minutes</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200/50 max-w-lg"
            >
              <div>
                <p className="text-2xl font-bold text-gray-900">48h</p>
                <p className="text-xs text-gray-500">Livraison moyenne</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="text-xs text-gray-500">Véhicules révisés</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">4.9/5</p>
                <p className="text-xs text-gray-500">Satisfaction client</p>
              </div>
            </motion.div>
          </div>

          {/* Large Hero Image */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotate: 1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl border border-white bg-white p-2"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
                  alt="Tesla Model S Plaid Showroom"
                  className="h-full w-full object-cover object-center transform hover:scale-105 transition duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-xl p-3.5 shadow-lg border border-white/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Modèle Vedette</p>
                    <p className="text-sm font-bold text-gray-900">Tesla Model S Plaid</p>
                  </div>
                  <span className="text-xs font-extrabold text-white bg-gray-900 px-3 py-1.5 rounded-lg">
                    89 900 €
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Float visual card 1 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute -top-6 -right-6 bg-white/95 backdrop-blur shadow-xl rounded-xl p-4 border border-gray-100 hidden md:flex items-center space-x-3"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Certifié d'Origine</p>
                <p className="text-[10px] text-gray-500">Garantie constructeur</p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
