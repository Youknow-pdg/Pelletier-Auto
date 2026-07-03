import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Shield, Euro, BarChart3, Receipt, Radio, ArrowUpRight, Sparkles, Check, RefreshCw, Upload, Database, Copy, AlertTriangle } from 'lucide-react';
import { Vehicle, Transaction, PushNotification, BankDetails } from '../types';
import { testSupabaseConnection, seedSupabaseDatabase, SUPABASE_SQL_SCHEMA } from '../lib/supabase';

// Helper to compress local images to prevent localStorage overflow
const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

interface AdminPanelProps {
  vehicles: Vehicle[];
  transactions: Transaction[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  onEditVehicle: (id: string, updatedFields: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
  onSendPushNotification: (title: string, message: string) => void;
  currentSection: 'admin' | 'transactions';
  onNavigateToSection: (section: 'browse' | 'contact' | 'admin' | 'transactions') => void;
  bankDetails: BankDetails;
  onUpdateBankDetails: (details: BankDetails) => void;
  onUpdateTransactionStatus?: (id: string, status: Transaction['status']) => void;
}

// Pre-configured elegant images that the admin can select with one-click
const PRESET_IMAGES = [
  { name: 'Tesla Rouge Sport', url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800' },
  { name: 'Porsche 911 Blanche', url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800' },
  { name: 'Audi R8 Jaune', url: 'https://images.unsplash.com/photo-1611245041308-59273c52f6f5?auto=format&fit=crop&q=80&w=800' },
  { name: 'BMW M8 Competition', url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800' },
  { name: 'Range Rover SUV Noir', url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=800' },
  { name: 'Mercedes-AMG GT Vert', url: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?auto=format&fit=crop&q=80&w=800' },
];

export default function AdminPanel({
  vehicles,
  transactions,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onSendPushNotification,
  currentSection,
  onNavigateToSection,
  bankDetails,
  onUpdateBankDetails,
  onUpdateTransactionStatus,
}: AdminPanelProps) {
  // Bank fields states
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankNom, setBankNom] = useState(bankDetails?.nom || '');
  const [bankIban, setBankIban] = useState(bankDetails?.iban || '');
  const [bankBic, setBankBic] = useState(bankDetails?.bic || '');
  const [bankSuccess, setBankSuccess] = useState(false);

  useEffect(() => {
    if (bankDetails) {
      setBankNom(bankDetails.nom);
      setBankIban(bankDetails.iban);
      setBankBic(bankDetails.bic);
    }
  }, [bankDetails]);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form Field States (no field is mandatory as requested)
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [mileage, setMileage] = useState('');
  const [image, setImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [transmission, setTransmission] = useState('');
  const [fuel, setFuel] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'available' | 'sold'>('available');

  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files) as File[];
    const loadedImages: string[] = [];

    for (const file of fileList) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Compress image to fit within localStorage space constraints cleanly
      const compressed = await compressImage(base64);
      loadedImages.push(compressed);
    }

    setImages((prev) => {
      const newImages = [...prev, ...loadedImages];
      if (!image && newImages.length > 0) {
        setImage(newImages[0]);
      }
      return newImages;
    });

    e.target.value = '';
  };

  // Push notification state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Supabase connection and seeding states
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      const { connected, error } = await testSupabaseConnection();
      setSupabaseConnected(connected);
      if (error) {
        setSupabaseError(error);
      }
    }
    checkConnection();
  }, []);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const result = await seedSupabaseDatabase(vehicles, transactions, []);
      if (result.success) {
        setSeedResult({
          success: true,
          message: 'Base de données Supabase initialisée et synchronisée avec succès !'
        });
        setSupabaseConnected(true);
        setSupabaseError(null);
      } else {
        setSeedResult({
          success: false,
          message: `Erreurs lors de l'initialisation : ${result.errors.join(', ')}`
        });
      }
    } catch (err: any) {
      setSeedResult({
        success: false,
        message: err.message || 'Une erreur inattendue est survenue.'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Initialize form when adding or editing
  const openForm = (vehicle: Vehicle | null = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setBrand(vehicle.brand || '');
      setModel(vehicle.model || '');
      setYear(vehicle.year?.toString() || '');
      setPrice(vehicle.price?.toString() || '');
      setMileage(vehicle.mileage?.toString() || '');
      setImage(vehicle.image || '');
      setImages(vehicle.images || (vehicle.image ? [vehicle.image] : []));
      setTransmission(vehicle.transmission || '');
      setFuel(vehicle.fuel || '');
      setColor(vehicle.color || '');
      setDescription(vehicle.description || '');
      setStatus(vehicle.status);
    } else {
      setEditingVehicle(null);
      setBrand('');
      setModel('');
      setYear('');
      setPrice('');
      setMileage('');
      setImage('');
      setImages([]);
      setTransmission('');
      setFuel('');
      setColor('');
      setDescription('');
      setStatus('available');
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare numerical data safely (handling optionals)
    const formattedVehicle = {
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      year: year ? parseInt(year) : undefined,
      price: price ? parseFloat(price) : undefined,
      mileage: mileage ? parseInt(mileage) : undefined,
      image: image.trim() || undefined,
      images: images && images.length > 0 ? images : (image.trim() ? [image.trim()] : undefined),
      transmission: transmission || undefined,
      fuel: fuel || undefined,
      color: color.trim() || undefined,
      description: description.trim() || undefined,
      status,
    };

    if (editingVehicle) {
      onEditVehicle(editingVehicle.id, formattedVehicle);
    } else {
      onAddVehicle(formattedVehicle);
    }

    setIsFormOpen(false);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    onSendPushNotification(notifTitle, notifMessage);
    setNotifSuccess(true);
    setNotifTitle('');
    setNotifMessage('');

    setTimeout(() => {
      setNotifSuccess(false);
    }, 3000);
  };

  // Transaction Stats
  const totalRevenue = transactions.reduce((acc, curr) => acc + curr.price, 0);
  const totalSales = transactions.length;
  const avgSaleValue = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 uppercase tracking-wider">
            Console Administrateur
          </span>
          <h1 className="text-3xl font-black text-gray-900 mt-2">
            {currentSection === 'admin' ? 'Gestion du Showroom' : 'Rapports & Ventes'}
          </h1>
          <p className="text-sm text-gray-500">
            {currentSection === 'admin' 
              ? 'Mettez à jour le stock, modifiez les fiches techniques et lancez des alertes.' 
              : 'Consultez l\'historique des transactions clients et analysez les revenus.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateToSection('admin')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition ${
              currentSection === 'admin'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Showroom & Stock
          </button>
          
          <button
            onClick={() => onNavigateToSection('transactions')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition ${
              currentSection === 'transactions'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Historique Ventes
          </button>
          
          {currentSection === 'admin' && (
            <button
              onClick={() => openForm(null)}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un Véhicule</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Showroom Stock Management */}
      {currentSection === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Stock Table */}
          <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/40">
              <h3 className="font-bold text-gray-900 text-sm">Inventaire du Stock ({vehicles.length})</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Véhicule</th>
                    <th className="px-6 py-3.5">Prix</th>
                    <th className="px-6 py-3.5">Détails</th>
                    <th className="px-6 py-3.5">Statut</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 italic">
                        Aucun véhicule en stock. Cliquez sur "Ajouter un véhicule" pour débuter.
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((v) => {
                      const title = [v.brand, v.model].filter(Boolean).join(' ') || 'Véhicule Spécial';
                      const img = v.image || 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=100';
                      
                      return (
                        <tr key={v.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <img src={img} alt={title} className="h-9 w-14 rounded-lg object-cover bg-gray-100" referrerPolicy="no-referrer" />
                              <div>
                                <p className="font-extrabold text-gray-900">{title}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{v.color || 'Couleur non spécifiée'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">
                              {v.price !== undefined ? `${v.price.toLocaleString('fr-FR')} €` : 'Sur demande'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 space-y-0.5">
                            <p>{v.year ? `${v.year} • ` : ''}{v.mileage ? `${v.mileage.toLocaleString('fr-FR')} km` : 'km non spécifié'}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{v.transmission || 'Boîte non spécifiée'} • {v.fuel || 'Moteur non spécifié'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              v.status === 'sold'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {v.status === 'sold' ? 'Vendu' : 'Disponible'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => openForm(v)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
                              title="Modifier"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
                                  onDeleteVehicle(v.id);
                                }
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 transition"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Broadcast Push Notification Box */}
          <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-50">
              <Radio className="h-5 w-5 text-red-600 animate-pulse" />
              <h3 className="font-bold text-gray-900 text-sm">Diffuser une Notification Push</h3>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              Alertez instantanément tous vos clients abonnés en publiant une offre exclusive, un nouveau prix, ou une vente privée.
            </p>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Titre de l'Alerte</label>
                <input
                  type="text"
                  required
                  placeholder="🔥 Offre Flash Exceptionnelle !"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Corps du message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="La Porsche 911 Carrera S vient de baisser de prix ! Contactez notre équipe au plus vite pour en profiter."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition resize-none"
                />
              </div>

              {notifSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 text-xs">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Notification diffusée avec succès !</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Radio className="h-4 w-4" />
                <span>Diffuser l'Alerte Client</span>
              </button>
            </form>
          </div>

          {/* Supabase Connection & Configuration Card */}
          <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-50">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-gray-800" />
                <h3 className="font-bold text-gray-900 text-sm">Base Supabase</h3>
              </div>
              <div>
                {supabaseConnected === true ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide gap-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Connecté
                  </span>
                ) : supabaseConnected === false ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide gap-1">
                    <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                    À configurer
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-50 text-gray-500 border border-gray-100 uppercase tracking-wide gap-1">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                    Vérification...
                  </span>
                )}
              </div>
            </div>

            {supabaseConnected === true ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Votre base de données Supabase est active et connectée ! Tous les véhicules, images (locales ou web) et transactions sont synchronisés en temps réel dans le Cloud.
                </p>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Les tables <code className="font-mono bg-emerald-100/50 px-1 py-0.5 rounded">vehicles</code> et <code className="font-mono bg-emerald-100/50 px-1 py-0.5 rounded">transactions</code> sont opérationnelles.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Le client Supabase est configuré, mais les tables de données sont manquantes ou inaccessibles. Suivez ces étapes simples pour finaliser l'installation :
                </p>

                {supabaseError && (
                  <div className="p-2.5 bg-amber-50 border border-amber-100 text-[10px] text-amber-800 rounded-xl font-mono leading-tight max-h-[60px] overflow-y-auto">
                    Erreur: {supabaseError}
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowSqlSchema(!showSqlSchema)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Database className="h-3.5 w-3.5" />
                    <span>{showSqlSchema ? 'Masquer le script SQL' : 'Afficher le script SQL'}</span>
                  </button>

                  {showSqlSchema && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold text-gray-400 uppercase">Script SQL à exécuter</span>
                        <button
                          type="button"
                          onClick={handleCopySql}
                          className="inline-flex items-center space-x-1 text-[10px] text-red-600 hover:text-red-700 font-bold transition"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedSql ? 'Copié !' : 'Copier'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-gray-900 text-gray-100 text-[10px] font-mono rounded-xl overflow-x-auto max-h-[160px] leading-relaxed border border-gray-800 scrollbar-none">
                        {SUPABASE_SQL_SCHEMA}
                      </pre>
                      <p className="text-[9px] text-gray-400 italic leading-snug">
                        ℹ️ Collez ce code dans le "SQL Editor" de Supabase et cliquez sur "Run".
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isSeeding}
                    onClick={handleSeedDatabase}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isSeeding ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                    )}
                    <span>Initialiser les données par défaut</span>
                  </button>
                </div>

                {seedResult && (
                  <div className={`p-3 border rounded-xl text-xs ${
                    seedResult.success 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-red-50 border-red-100 text-red-800'
                  }`}>
                    {seedResult.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bank Details Management Card */}
          <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-50">
              <div className="flex items-center space-x-2">
                <Euro className="h-5 w-5 text-gray-800" />
                <h3 className="font-bold text-gray-900 text-sm">Coordonnées de Virement</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isEditingBank) {
                    setBankNom(bankDetails?.nom || '');
                    setBankIban(bankDetails?.iban || '');
                    setBankBic(bankDetails?.bic || '');
                  }
                  setIsEditingBank(!isEditingBank);
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 transition cursor-pointer"
              >
                {isEditingBank ? 'Annuler' : 'Modifier'}
              </button>
            </div>

            {!isEditingBank ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Ces coordonnées bancaires sont affichées aux clients pour l'achat de véhicules par virement bancaire.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 font-mono text-xs border border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans font-bold block uppercase tracking-wider">Bénéficiaire</span>
                    <span className="text-gray-900 font-semibold">{bankDetails?.nom || 'Non configuré'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans font-bold block uppercase tracking-wider">IBAN</span>
                    <span className="text-gray-900 font-semibold break-all select-all">{bankDetails?.iban || 'Non configuré'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans font-bold block uppercase tracking-wider">BIC / SWIFT</span>
                    <span className="text-gray-900 font-semibold select-all">{bankDetails?.bic || 'Non configuré'}</span>
                  </div>
                </div>
                {bankDetails?.updatedAt && (
                  <p className="text-[10px] text-gray-400 text-right italic">
                    Mis à jour : {new Date(bankDetails.updatedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdateBankDetails({
                    id: 'default',
                    nom: bankNom.trim(),
                    iban: bankIban.trim().replace(/\s/g, ''),
                    bic: bankBic.trim().toUpperCase(),
                    updatedAt: new Date().toISOString()
                  });
                  setIsEditingBank(false);
                  setBankSuccess(true);
                  setTimeout(() => setBankSuccess(false), 3000);
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Nom du Bénéficiaire</label>
                  <input
                    type="text"
                    required
                    placeholder="Naouh Fatih"
                    value={bankNom}
                    onChange={(e) => setBankNom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">IBAN</label>
                  <input
                    type="text"
                    required
                    placeholder="FR76 1621 8000 0140 1214 2778 679"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs font-mono outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">BIC / SWIFT</label>
                  <input
                    type="text"
                    required
                    placeholder="BFBKFRP1"
                    value={bankBic}
                    onChange={(e) => setBankBic(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs font-mono outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Enregistrer les modifications</span>
                </button>
              </form>
            )}

            {bankSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 text-xs">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Coordonnées enregistrées !</span>
              </div>
            )}
          </div>


        </div>
      )}

      {/* VIEW 2: Sales Reports & Transaction History */}
      {currentSection === 'transactions' && (
        <div className="space-y-8">
          
          {/* Quick Metrics dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chiffre d'Affaires</p>
                <p className="text-3xl font-black text-gray-900">{totalRevenue.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Euro className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Véhicules Vendus</p>
                <p className="text-3xl font-black text-gray-900">{totalSales} unités</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Panier Moyen</p>
                <p className="text-3xl font-black text-gray-900">{avgSaleValue.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-red-600 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Detailed transactions ledger */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/40">
              <h3 className="font-bold text-gray-900 text-sm">Registre des Transactions Clients</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Référence</th>
                    <th className="px-6 py-3.5">Véhicule</th>
                    <th className="px-6 py-3.5">Client & Contacts</th>
                    <th className="px-6 py-3.5">Date & Heure</th>
                    <th className="px-6 py-3.5">Paiement</th>
                    <th className="px-6 py-3.5">Statut / Actions</th>
                    <th className="px-6 py-3.5 text-right">Montant Réglé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 italic">
                        Aucun historique de vente disponible.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const carTitle = [tx.vehicleBrand, tx.vehicleModel].filter(Boolean).join(' ') || 'Véhicule Spécial';
                      
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">{tx.id}</td>
                          <td className="px-6 py-4">
                            <span className="font-extrabold text-gray-900">{carTitle}</span>
                          </td>
                          <td className="px-6 py-4 space-y-0.5 text-gray-500">
                            <p className="font-bold text-gray-900">{tx.buyerName}</p>
                            <p>{tx.buyerEmail}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{tx.buyerPhone}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(tx.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-mono space-y-0.5">
                            <p className="font-semibold text-gray-800">{tx.paymentMethod}</p>
                            {tx.paymentMethod !== 'Virement Bancaire' && (
                              <p className="text-[10px] text-gray-400">Carte : •••• {tx.cardNumber}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col space-y-1.5">
                              {/* Status Badge */}
                              {tx.status === 'success' || tx.status === 'virement_recu' ? (
                                <span className="inline-flex items-center gap-1 w-fit font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                                  Virement reçu (Confirmé)
                                </span>
                              ) : tx.status === 'virement_non_recu' ? (
                                <span className="inline-flex items-center gap-1 w-fit font-extrabold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full text-[10px]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                  Virement non reçu (Rejeté)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 w-fit font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  En attente de virement
                                </span>
                              )}

                              {/* Action Buttons for Virement Bancaire */}
                              {tx.paymentMethod === 'Virement Bancaire' && onUpdateTransactionStatus && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onUpdateTransactionStatus(tx.id, 'success')}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                      tx.status === 'success' || tx.status === 'virement_recu'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                    title="Confirmer la réception du virement"
                                  >
                                    <Check className="h-3 w-3" />
                                    Reçu
                                  </button>
                                  <button
                                    onClick={() => onUpdateTransactionStatus(tx.id, 'virement_non_recu')}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                      tx.status === 'virement_non_recu'
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                                    }`}
                                    title="Signaler virement non reçu"
                                  >
                                    <X className="h-3 w-3" />
                                    Non reçu
                                  </button>
                                  <button
                                    onClick={() => onUpdateTransactionStatus(tx.id, 'pending')}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                      tx.status === 'pending'
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-700'
                                    }`}
                                    title="Remettre en attente"
                                  >
                                    <RefreshCw className="h-2.5 w-2.5" />
                                    Attente
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                              +{tx.price.toLocaleString('fr-FR')} €
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL: Full Vehicle Form (Create & Update) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
              
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-gray-800" />
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingVehicle ? 'Modifier la fiche véhicule' : 'Ajouter un nouveau véhicule'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Informative note */}
              <div className="bg-red-50/50 rounded-xl p-3 border border-red-100 text-[11px] text-red-700 leading-relaxed">
                ℹ️ **Note sur la saisie libre :** Aucun champ de cette fiche technique n'est obligatoire. 
                Remplissez uniquement les caractéristiques de votre choix. Si un champ est laissé vide, 
                il sera automatiquement masqué de l'affichage client avec élégance.
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                
                {/* Brand & Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Marque / Constructeur</label>
                    <input
                      type="text"
                      placeholder="ex: Porsche, Tesla"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Modèle</label>
                    <input
                      type="text"
                      placeholder="ex: 911 Carrera S"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition"
                    />
                  </div>
                </div>

                {/* Price, Year & Mileage */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Prix de vente (€)</label>
                    <input
                      type="number"
                      placeholder="ex: 89000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Année</label>
                    <input
                      type="number"
                      placeholder="ex: 2022"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Kilométrage</label>
                    <input
                      type="number"
                      placeholder="ex: 12500"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition font-mono"
                    />
                  </div>
                </div>

                {/* Presets, URLs, and Local Images */}
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">
                        Images du Véhicule (Locales ou URL)
                      </label>
                      <span className="text-[9px] text-gray-400">Ajoutez autant d\'images que souhaité</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Local Upload */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Option A : Charger depuis votre appareil</span>
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-red-500 hover:bg-gray-50/50 rounded-2xl p-4 cursor-pointer transition text-center space-y-1.5 min-h-[96px]">
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-xs font-bold text-gray-700">Sélectionner des images locales</span>
                          <span className="text-[9px] text-gray-400">Fichiers JPEG, PNG, WebP...</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleLocalImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* URL Upload */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Option B : Ajouter par URL Web</span>
                        <div className="flex gap-2 min-h-[96px] items-start">
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="url"
                              id="add-image-url-input"
                              placeholder="https://images.unsplash.com/photo-..."
                              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition font-mono"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (val) {
                                    setImages((prev) => {
                                      const updated = [...prev, val];
                                      if (!image) setImage(val);
                                      return updated;
                                    });
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                            <p className="text-[9px] text-gray-400 leading-normal">
                              Saisissez l\'adresse internet de l\'image et cliquez sur "Ajouter".
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('add-image-url-input') as HTMLInputElement;
                              const val = input?.value.trim();
                              if (val) {
                                setImages((prev) => {
                                  const updated = [...prev, val];
                                  if (!image) setImage(val);
                                  return updated;
                                });
                                input.value = '';
                              }
                            }}
                            className="px-3.5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition h-10 cursor-pointer"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preset quick buttons */}
                    <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 space-y-2">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">⚡ Galerie de démonstration pré-configurée (Clic pour ajouter) :</p>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_IMAGES.map((imgPreset) => {
                          const isAlreadyIn = images.includes(imgPreset.url);
                          return (
                            <button
                              key={imgPreset.name}
                              type="button"
                              onClick={() => {
                                if (!isAlreadyIn) {
                                  setImages((prev) => {
                                    const updated = [...prev, imgPreset.url];
                                    if (!image) setImage(imgPreset.url);
                                    return updated;
                                  });
                                }
                              }}
                              disabled={isAlreadyIn}
                              className={`text-[10px] px-2.5 py-1 rounded-lg transition font-medium border ${
                                isAlreadyIn 
                                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                              }`}
                            >
                              {imgPreset.name} {isAlreadyIn && '✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail gallery for the vehicle */}
                  {images.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">
                          Galerie du Véhicule ({images.length} images)
                        </label>
                        <span className="text-[9px] text-gray-400 italic">Définissez une image comme couverture ou supprimez-la</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {images.map((imgUrl, idx) => {
                          const isMain = image === imgUrl;
                          return (
                            <div 
                              key={idx} 
                              className={`relative group aspect-[16/10] rounded-xl overflow-hidden border bg-gray-50 transition ${
                                isMain ? 'border-red-600 ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img 
                                src={imgUrl} 
                                alt={`Vehicle ${idx + 1}`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              
                              {/* Overlay controls */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5">
                                {!isMain && (
                                  <button
                                    type="button"
                                    onClick={() => setImage(imgUrl)}
                                    className="w-full py-1 bg-white hover:bg-gray-100 text-gray-900 text-[9px] font-bold rounded-lg transition"
                                  >
                                    Définir Principale
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImages((prev) => {
                                      const filtered = prev.filter((_, i) => i !== idx);
                                      if (isMain && filtered.length > 0) {
                                        setImage(filtered[0]);
                                      } else if (filtered.length === 0) {
                                        setImage('');
                                      }
                                      return filtered;
                                    });
                                  }}
                                  className="w-full py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Supprimer</span>
                                </button>
                              </div>

                              {isMain && (
                                <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm">
                                  Principale
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fuel, Transmission & Color */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Carburant</label>
                    <select
                      value={fuel}
                      onChange={(e) => setFuel(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition cursor-pointer"
                    >
                      <option value="">Non spécifié</option>
                      <option value="Essence">Essence</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Électrique">Électrique</option>
                      <option value="Hybride">Hybride</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Transmission</label>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition cursor-pointer"
                    >
                      <option value="">Non spécifié</option>
                      <option value="Automatique">Automatique</option>
                      <option value="Manuelle">Manuelle</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Coloris / Teinte</label>
                    <input
                      type="text"
                      placeholder="ex: Gris Craie"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition"
                    />
                  </div>
                </div>

                {/* Status & Description */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Disponibilité</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'available' | 'sold')}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none font-bold transition cursor-pointer text-gray-800"
                    >
                      <option value="available" className="text-emerald-600">Disponible</option>
                      <option value="sold" className="text-red-600">Vendu</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Description / Présentation libre</label>
                    <textarea
                      rows={2}
                      placeholder="Présentation des finitions, options exclusives..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl text-xs outline-none transition resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center justify-center space-x-1"
                  >
                    <Check className="h-4 w-4" />
                    <span>{editingVehicle ? 'Sauvegarder les modifications' : 'Publier l\'annonce'}</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Add a simple SVG close icon inline
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
