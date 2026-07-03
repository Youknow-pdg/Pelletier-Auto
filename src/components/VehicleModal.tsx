import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Gauge, Fuel, Shield, CreditCard, ChevronRight, ChevronLeft, Eye, RefreshCw } from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onBuyClick: (vehicle: Vehicle) => void;
  isAdmin: boolean;
  onEditClick?: (vehicle: Vehicle) => void;
}

export default function VehicleModal({
  vehicle,
  onClose,
  onBuyClick,
  isAdmin,
  onEditClick,
}: VehicleModalProps) {
  if (!vehicle) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset active index when a new vehicle is loaded
  useEffect(() => {
    setActiveImageIndex(0);
  }, [vehicle.id]);

  const isSold = vehicle.status === 'sold';
  const title = [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || 'Véhicule Spécial';
  
  const displayPrice = vehicle.price !== undefined 
    ? `${vehicle.price.toLocaleString('fr-FR')} €` 
    : 'Sur demande';

  const imageUrl = vehicle.image && vehicle.image.trim() !== ''
    ? vehicle.image
    : 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=800';

  const galleryImages = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : [imageUrl];

  const currentActiveImage = galleryImages[activeImageIndex] || imageUrl;

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Wrapper */}
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col md:flex-row"
          >
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 hover:bg-black/60 text-white transition focus:outline-none"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image Section */}
            <div className="md:w-1/2 relative bg-gray-950 flex flex-col justify-between overflow-hidden aspect-video md:aspect-auto min-h-[300px] md:min-h-[480px]">
              
              {/* Main Image Slide */}
              <div className="relative flex-1 w-full h-full overflow-hidden min-h-[220px]">
                <img
                  src={currentActiveImage}
                  alt={`${title} - Vue ${activeImageIndex + 1}`}
                  className="h-full w-full object-cover object-center transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />

                {/* Left/Right Navigation Arrows for Gallery */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition focus:outline-none"
                      title="Précédent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition focus:outline-none"
                      title="Suivant"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Badges & Titles Overlay (absolute to display above main picture details) */}
              <div className="absolute bottom-[80px] md:bottom-[90px] left-6 right-6 text-white space-y-1.5 pointer-events-none z-10">
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-extrabold uppercase shadow-md ${
                  isSold ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {isSold ? 'Vendu' : 'Disponible à l\'achat'}
                </span>
                <p className="text-2xl font-black tracking-tight leading-tight">{title}</p>
              </div>

              {/* Thumbnails Row */}
              {galleryImages.length > 1 && (
                <div className="w-full bg-black/95 p-3 border-t border-white/5 flex items-center justify-start gap-2 overflow-x-auto scrollbar-none z-10">
                  {galleryImages.map((img, idx) => {
                    const isActive = idx === activeImageIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative h-11 w-16 rounded-lg overflow-hidden border shrink-0 transition-all ${
                          isActive 
                            ? 'border-red-500 ring-2 ring-red-500/30 opacity-100 scale-102' 
                            : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-90'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`${title} miniature ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
              <div className="space-y-6">
                
                {/* Header info */}
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {vehicle.brand || 'Constructeur haut de gamme'}
                  </span>
                  <h2 className="text-2xl font-extrabold text-gray-900 mt-1">{vehicle.model || 'Édition Spéciale'}</h2>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-gray-900">{displayPrice}</span>
                    {vehicle.price !== undefined && (
                      <span className="text-xs font-medium text-gray-500">TVA incluse</span>
                    )}
                  </div>
                </div>

                {/* Grid of details - only showing populated fields */}
                <div className="grid grid-cols-2 gap-3">
                  {vehicle.year !== undefined && (
                    <div className="flex items-center space-x-3 rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Année</p>
                        <p className="text-sm font-semibold text-gray-900">{vehicle.year}</p>
                      </div>
                    </div>
                  )}

                  {vehicle.mileage !== undefined && (
                    <div className="flex items-center space-x-3 rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                      <Gauge className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Kilométrage</p>
                        <p className="text-sm font-semibold text-gray-900">{vehicle.mileage.toLocaleString('fr-FR')} km</p>
                      </div>
                    </div>
                  )}

                  {vehicle.fuel && (
                    <div className="flex items-center space-x-3 rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                      <Fuel className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Carburant</p>
                        <p className="text-sm font-semibold text-gray-900">{vehicle.fuel}</p>
                      </div>
                    </div>
                  )}

                  {vehicle.transmission && (
                    <div className="flex items-center space-x-3 rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
                      <Eye className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Boîte</p>
                        <p className="text-sm font-semibold text-gray-900">{vehicle.transmission}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Details Row for Color or Custom attributes */}
                {vehicle.color && (
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-gray-100 text-xs">
                    <span className="font-bold text-gray-500 uppercase">Teinte carrosserie</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                      {vehicle.color}
                    </span>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Présentation du véhicule</h4>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                    {vehicle.description || 'Aucune description fournie pour ce véhicule. Contactez notre équipe commerciale de Pelletier Automobile pour obtenir plus d\'informations.'}
                  </p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col gap-3">
                
                {/* Customer Checkout CTA */}
                {!isSold ? (
                  <button
                    onClick={() => {
                      onBuyClick(vehicle);
                      onClose();
                    }}
                    className="flex w-full items-center justify-center space-x-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white py-4 text-sm font-bold shadow-md transition-all hover:shadow-lg focus:outline-none"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Acheter en ligne sécurisé</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex w-full items-center justify-center space-x-3 rounded-2xl bg-gray-100 border border-gray-200 text-gray-400 py-4 text-sm font-bold cursor-not-allowed"
                  >
                    <span>Véhicule déjà vendu</span>
                  </button>
                )}

                {/* Admin Shortcut Quick Edit */}
                {isAdmin && onEditClick && (
                  <button
                    onClick={() => {
                      onEditClick(vehicle);
                      onClose();
                    }}
                    className="flex w-full items-center justify-center space-x-2 rounded-2xl border border-dashed border-gray-300 hover:border-gray-900 text-gray-700 py-3 text-xs font-bold transition hover:bg-gray-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                    <span>Modifier la fiche technique (Admin)</span>
                  </button>
                )}

                {/* Trust footer */}
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Achat sécurisé • Garantie Pelletier Automobile • Certification européenne
                  </p>
                </div>
              </div>

            </div>

          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
