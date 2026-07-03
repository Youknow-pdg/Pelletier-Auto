import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, CreditCard, User, Mail, Phone, Lock, CheckCircle2, ArrowRight, Printer, AlertTriangle, AlertCircle } from 'lucide-react';
import { Vehicle } from '../types';

interface CheckoutModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onPaymentSuccess: (
    buyerName: string,
    buyerEmail: string,
    buyerPhone: string,
    paymentMethod: string,
    cardNumber: string
  ) => void;
}

type CheckoutStep = 'details' | 'payment' | 'processing' | 'success';

export default function CheckoutModal({ vehicle, onClose, onPaymentSuccess }: CheckoutModalProps) {
  if (!vehicle) return null;

  const [step, setStep] = useState<CheckoutStep>('details');
  
  // Buyer Info State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Payment Info State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const title = [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || 'Véhicule Spécial';
  const price = vehicle.price || 0;
  const transactionFee = Math.round(price * 0.005); // 0.5% handling
  const totalAmount = price + transactionFee;
  const [txId] = useState(() => `TX-${Math.floor(100000 + Math.random() * 900000)}`);

  // Simple validation for details
  const validateDetails = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Le nom complet est requis.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Veuillez saisir un e-mail valide.';
    if (!phone.trim() || phone.length < 8) newErrors.phone = 'Numéro de téléphone invalide.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Simple validation for payment card
  const validatePayment = () => {
    const newErrors: Record<string, string> = {};
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 16) newErrors.cardNumber = 'Numéro de carte invalide (16 chiffres requis).';
    if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(cardExpiry)) newErrors.cardExpiry = "Date d'expiration invalide (MM/AA).";
    if (cardCvv.length < 3) newErrors.cardCvv = 'Code de sécurité invalide (3 chiffres).';
    if (!cardHolder.trim()) newErrors.cardHolder = 'Le nom du titulaire est requis.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle formatted card input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.substring(0, 16);
    // Add space every 4 digits
    const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) setCardCvv(value);
  };

  // Step transitions
  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDetails()) {
      setStep('payment');
    }
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePayment()) {
      setStep('processing');
      // Simulate bank verification
      setTimeout(() => {
        setStep('success');
        onPaymentSuccess(name, email, phone, 'Carte Bancaire', cardNumber.slice(-4));
      }, 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step !== 'processing' ? onClose : undefined}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4 bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Paiement Sécurisé SSL</span>
              </div>
              {step !== 'processing' && (
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Main Content Area */}
            <div className="p-6 flex-1">
              {/* Stepper Progress Indicator */}
              {step !== 'processing' && step !== 'success' && (
                <div className="mb-6 flex justify-center items-center space-x-3">
                  <div className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${
                    step === 'details' ? 'bg-gray-900 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    1. Coordonnées
                  </div>
                  <div className="h-0.5 w-8 bg-gray-200" />
                  <div className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${
                    step === 'payment' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    2. Paiement
                  </div>
                </div>
              )}

              {/* Steps views */}
              <AnimatePresence mode="wait">
                
                {/* STEP 1: Details */}
                {step === 'details' && (
                  <motion.form
                    key="step-details"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleNextToPayment}
                    className="space-y-4"
                  >
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Véhicule réservé</p>
                      <p className="text-sm font-bold text-gray-900">{title}</p>
                      <p className="text-lg font-black text-red-600">{(price).toLocaleString('fr-FR')} €</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nom Complet</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Jean Dupont"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${
                              errors.name ? 'border-red-500' : 'border-gray-200 focus:border-gray-900'
                            } rounded-xl text-sm outline-none transition`}
                          />
                        </div>
                        {errors.name && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            placeholder="jean.dupont@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${
                              errors.email ? 'border-red-500' : 'border-gray-200 focus:border-gray-900'
                            } rounded-xl text-sm outline-none transition`}
                          />
                        </div>
                        {errors.email && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Numéro de Téléphone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            placeholder="+33 6 12 34 56 78"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${
                              errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-gray-900'
                            } rounded-xl text-sm outline-none transition`}
                          />
                        </div>
                        {errors.phone && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.phone}</p>}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 mt-6 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition flex items-center justify-center space-x-2"
                    >
                      <span>Saisir les données bancaires</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.form>
                )}

                {/* STEP 2: Payment Details */}
                {step === 'payment' && (
                  <motion.form
                    key="step-payment"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onSubmit={handleConfirmPayment}
                    className="space-y-4"
                  >
                    {/* Invoice recap card */}
                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Montant véhicule :</span>
                        <span className="font-bold text-gray-900">{(price).toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Frais de traitement (0.5%) :</span>
                        <span className="font-bold text-gray-900">{(transactionFee).toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="h-px bg-gray-200/60" />
                      <div className="flex justify-between text-sm font-black text-gray-900">
                        <span>Total à régler :</span>
                        <span>{(totalAmount).toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>

                    {/* Virtual Card illustration */}
                    <div className="rounded-2xl bg-gradient-to-br from-gray-900 via-slate-800 to-gray-950 p-5 text-white shadow-lg space-y-6">
                      <div className="flex justify-between items-start">
                        <CreditCard className="h-8 w-8 text-white/90" />
                        <span className="text-[10px] font-bold text-white/50 tracking-widest">SECURE CHIP</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-mono tracking-widest text-center min-h-[28px]">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </p>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="truncate">{cardHolder.toUpperCase() || 'TITULAIRE DE CARTE'}</span>
                          <span>{cardExpiry || 'MM/AA'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Input form */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nom du Titulaire</label>
                        <input
                          type="text"
                          placeholder="M. Jean Dupont"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className={`w-full px-4 py-2.5 bg-gray-50 border ${
                            errors.cardHolder ? 'border-red-500' : 'border-gray-200 focus:border-gray-900'
                          } rounded-xl text-sm outline-none transition`}
                        />
                        {errors.cardHolder && <p className="text-red-500 text-[11px] mt-1">{errors.cardHolder}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Numéro de carte</label>
                        <input
                          type="text"
                          placeholder="4532 9845 2312 8945"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className={`w-full px-4 py-2.5 bg-gray-50 border ${
                            errors.cardNumber ? 'border-red-500' : 'border-gray-200 focus:border-gray-900'
                          } rounded-xl text-sm font-mono outline-none transition`}
                        />
                        {errors.cardNumber && <p className="text-red-500 text-[11px] mt-1">{errors.cardNumber}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiration</label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            className={`w-full px-4 py-2.5 bg-gray-50 border ${
                              errors.cardExpiry ? 'border-red-500' : 'border-gray-200 focus:border-gray-900'
                            } rounded-xl text-sm font-mono outline-none transition text-center`}
                          />
                          {errors.cardExpiry && <p className="text-red-500 text-[11px] mt-1">{errors.cardExpiry}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">CVV / CVC</label>
                          <input
                            type="password"
                            placeholder="123"
                            value={cardCvv}
                            onChange={handleCvvChange}
                            className={`w-full px-4 py-2.5 bg-gray-50 border ${
                              errors.cardCvv ? 'border-red-500' : 'border-gray-200 focus:border-gray-900'
                            } rounded-xl text-sm font-mono outline-none transition text-center`}
                          />
                          {errors.cardCvv && <p className="text-red-500 text-[11px] mt-1">{errors.cardCvv}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep('details')}
                        className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                      >
                        Retour
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-md hover:shadow-lg"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Payer {(totalAmount).toLocaleString('fr-FR')} €</span>
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* STEP 3: Secure Processing */}
                {step === 'processing' && (
                  <motion.div
                    key="step-processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="relative flex items-center justify-center h-20 w-20">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
                      <Lock className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-gray-900">Traitement de la transaction...</h3>
                      <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                        Veuillez patienter. Nous établissons une connexion sécurisée chiffrée avec l'établissement bancaire. Ne fermez pas cette fenêtre.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Success Receipt */}
                {step === 'success' && (
                  <motion.div
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 print-recap"
                  >
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900">Achat Confirmé !</h3>
                        <p className="text-xs text-emerald-600 font-bold">Paiement reçu avec succès</p>
                      </div>
                    </div>

                    {/* Official invoice layout */}
                    <div className="rounded-2xl border border-gray-100 p-4 space-y-3 bg-gray-50 text-xs font-mono">
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>TRANSACTION : {txId}</span>
                        <span>DATE : {new Date().toLocaleDateString('fr-FR')}</span>
                      </div>
                      
                      <div className="border-t border-dashed border-gray-200 my-2" />
                      
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Client :</span>
                          <span className="font-bold text-gray-900">{name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">E-mail :</span>
                          <span className="text-gray-800">{email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Véhicule :</span>
                          <span className="font-bold text-gray-900">{title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Paiement :</span>
                          <span className="text-gray-800">Carte Bancaire (•••• {cardNumber.slice(-4)})</span>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-gray-200 my-2" />

                      <div className="space-y-1 text-right">
                        <p className="text-[10px] text-gray-400">Montant TTC : {(price).toLocaleString('fr-FR')} €</p>
                        <p className="text-[10px] text-gray-400">Frais d'émission : {(transactionFee).toLocaleString('fr-FR')} €</p>
                        <p className="text-sm font-black text-gray-900 pt-1">Total Payé : {(totalAmount).toLocaleString('fr-FR')} €</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={handlePrint}
                        className="w-1/2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Imprimer Reçu</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="w-1/2 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center"
                      >
                        Fermer la commande
                      </button>
                    </div>

                    <p className="text-[10px] text-center text-gray-400 italic">
                      Un e-mail de confirmation contenant la facture officielle et le contrat de cession de véhicule vous a été envoyé à l'adresse {email}. Notre service de livraison prendra contact sous 24 heures.
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
