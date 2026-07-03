import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Key, User, ArrowRight, Lock } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate login verification
    setTimeout(() => {
      if (
        (username.trim().toLowerCase() === 'admin' || username.trim() === 'admin@dealership.com') &&
        password === 'admin123'
      ) {
        onLoginSuccess();
        onClose();
        setUsername('');
        setPassword('');
      } else {
        setError('Identifiants incorrects. Veuillez utiliser admin / admin123');
      }
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal box */}
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 p-1.5 hover:bg-gray-100 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title / Header */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-sm">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Espace Administrateur</h3>
                <p className="text-xs text-gray-500">Authentification requise pour la gestion</p>
              </div>
            </div>

            {/* Hint for testing */}
            <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100 flex items-start gap-2.5 text-xs text-amber-800">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Mode Démo</p>
                <p className="font-mono text-[11px] mt-0.5">Identifiants : admin / admin123</p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Identifiant</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="admin ou admin@dealership.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-950 rounded-xl text-sm outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mot de passe</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-gray-950 rounded-xl text-sm outline-none transition"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs font-semibold text-center mt-1 animate-pulse">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Connexion en cours...' : 'Se connecter'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
