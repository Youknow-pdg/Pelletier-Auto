import React from 'react';
import { motion } from 'motion/react';
import { Fuel, Calendar, Gauge, Shield, CreditCard, Sparkles } from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleCardProps {
  key?: string;
  vehicle: Vehicle;
  onViewDetails: (vehicle: Vehicle) => void;
  onBuyClick: (vehicle: Vehicle) => void;
}

export default function VehicleCard({ vehicle, onViewDetails, onBuyClick }: VehicleCardProps) {
  const isNew = new Date(vehicle.createdAt).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000;
  const isSold = vehicle.status === 'sold';

  // Format price
  const displayPrice = vehicle.price !== undefined 
    ? `${vehicle.price.toLocaleString('fr-FR')} €` 
    : 'Sur demande';

  // Format title
  const displayTitle = [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || 'Véhicule d’exception';

  // Fallback image in case admin didn't input any or it's invalid
  const imageUrl = vehicle.image && vehicle.image.trim() !== ''
    ? vehicle.image
    : 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=600'; // high-end sports car blurred track fallback

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-gray-200/60 transition-all duration-300"
    >
      {/* Image container */}
      <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden cursor-pointer" onClick={() => onViewDetails(vehicle)}>
        <img
          src={imageUrl}
          alt={displayTitle}
          className="h-full w-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
          {isSold ? (
            <span className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              Vendu
            </span>
          ) : (
            <span className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
              Disponible
            </span>
          )}

          {isNew && !isSold && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-900/95 backdrop-blur px-3 py-1 text-xs font-bold text-white shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400" />
              Nouveau
            </span>
          )}
        </div>

        {/* Quick details ribbon */}
        {vehicle.color && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md rounded-lg px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm border border-white/50">
            {vehicle.color}
          </div>
        )}
      </div>

      {/* Description and metadata */}
      <div className="flex-1 flex flex-col p-5 space-y-4">
        {/* Brand & Model */}
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {vehicle.brand || 'Marque non spécifiée'}
          </p>
          <h3 
            className="text-lg font-bold text-gray-900 leading-snug cursor-pointer hover:text-red-600 transition"
            onClick={() => onViewDetails(vehicle)}
          >
            {vehicle.model || 'Modèle spécial'}
          </h3>
        </div>

        {/* Dynamic Optional Attributes grid */}
        <div className="grid grid-cols-3 gap-2 py-1.5 border-t border-b border-gray-50 text-xs text-gray-500 font-medium">
          {vehicle.year !== undefined ? (
            <div className="flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>{vehicle.year}</span>
            </div>
          ) : (
            <div className="text-[10px] text-gray-300 italic flex items-center">N/A (Année)</div>
          )}

          {vehicle.mileage !== undefined ? (
            <div className="flex items-center space-x-1.5">
              <Gauge className="h-3.5 w-3.5 text-gray-400" />
              <span>{vehicle.mileage.toLocaleString('fr-FR')} km</span>
            </div>
          ) : (
            <div className="text-[10px] text-gray-300 italic flex items-center">N/A (km)</div>
          )}

          {vehicle.fuel ? (
            <div className="flex items-center space-x-1.5 truncate">
              <Fuel className="h-3.5 w-3.5 text-gray-400" />
              <span className="truncate">{vehicle.fuel}</span>
            </div>
          ) : (
            <div className="text-[10px] text-gray-300 italic flex items-center">N/A (Moteur)</div>
          )}
        </div>

        {/* Price and Action CTAs */}
        <div className="pt-2 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prix</span>
            <span className="text-xl font-extrabold text-gray-900">{displayPrice}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewDetails(vehicle)}
              className="text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 transition"
            >
              Détails
            </button>
            
            {isSold ? (
              <button
                disabled
                className="flex items-center space-x-1.5 text-xs font-semibold bg-gray-100 text-gray-400 px-4 py-2.5 rounded-xl border border-gray-200 cursor-not-allowed"
              >
                <span>Vendu</span>
              </button>
            ) : (
              <button
                onClick={() => onBuyClick(vehicle)}
                className="group flex items-center space-x-1.5 text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl transition-all hover:shadow-md"
              >
                <CreditCard className="h-3.5 w-3.5 text-gray-300 group-hover:text-white" />
                <span>Acheter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
