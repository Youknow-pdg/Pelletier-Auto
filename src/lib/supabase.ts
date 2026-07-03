import { createClient } from '@supabase/supabase-js';
import { Vehicle, Transaction, PushNotification } from '../types';

// Supabase configuration from environment or provided credentials as fallback
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://xacwfjlaalnochjdfmoa.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY3dmamxhYWxub2NoamRmbW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzQ5NzEsImV4cCI6MjA5ODY1MDk3MX0.tqmuu6Iakivgsix5gK2-5X65XUC_mHmzxLjizKdYmmA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if Supabase tables exist and can be queried
export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.from('vehicles').select('id').limit(1);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err.message || 'Unknown network error' };
  }
}

// SQL Schema script to print in case tables don't exist
export const SUPABASE_SQL_SCHEMA = `-- Copiez et collez ce script dans l'éditeur SQL de votre tableau de bord Supabase (SQL Editor)

-- 1. Table des véhicules
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  brand TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC,
  mileage INTEGER,
  image TEXT,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  transmission TEXT,
  fuel TEXT,
  color TEXT,
  status TEXT DEFAULT 'available',
  "createdAt" TEXT
);

-- Activez RLS pour permettre les lectures anonymes et les écritures de l'admin
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique des vehicules" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Gestion totale des vehicules" ON vehicles FOR ALL USING (true) WITH CHECK (true);

-- 2. Table des transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  "vehicleBrand" TEXT,
  "vehicleModel" TEXT,
  price NUMERIC,
  "buyerName" TEXT,
  "buyerEmail" TEXT,
  "buyerPhone" TEXT,
  date TEXT,
  "paymentMethod" TEXT,
  "cardNumber" TEXT,
  status TEXT DEFAULT 'success'
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture des transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Ajout de transaction" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Gestion totale des transactions" ON transactions FOR ALL USING (true);

-- 3. Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT,
  message TEXT,
  time TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT,
  "vehicleId" TEXT
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture des notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Gestion totale des notifications" ON notifications FOR ALL USING (true);
`;

// Helper to standardise base64 image uploading to supabase bucket if needed (though storing as text/base64 directly works perfectly in the TEXT field)

// --- VEHICLES API ---
export async function getSupabaseVehicles(): Promise<Vehicle[] | null> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.warn('Supabase getSupabaseVehicles error, falling back to localStorage:', error.message);
      return null;
    }
    return data as Vehicle[];
  } catch (err) {
    console.warn('Supabase connection failed:', err);
    return null;
  }
}

export async function upsertSupabaseVehicle(vehicle: Vehicle): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('vehicles')
      .upsert({
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        mileage: vehicle.mileage,
        image: vehicle.image,
        images: vehicle.images || (vehicle.image ? [vehicle.image] : []),
        description: vehicle.description,
        transmission: vehicle.transmission,
        fuel: vehicle.fuel,
        color: vehicle.color,
        status: vehicle.status,
        createdAt: vehicle.createdAt
      });

    if (error) {
      console.error('Supabase upsertVehicle error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase upsertVehicle failed:', err);
    return false;
  }
}

export async function deleteSupabaseVehicle(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase deleteVehicle error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase deleteVehicle failed:', err);
    return false;
  }
}

// --- TRANSACTIONS API ---
export async function getSupabaseTransactions(): Promise<Transaction[] | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase getSupabaseTransactions error, falling back to localStorage:', error.message);
      return null;
    }
    return data as Transaction[];
  } catch (err) {
    console.warn('Supabase transactions failed:', err);
    return null;
  }
}

export async function insertSupabaseTransaction(transaction: Transaction): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        id: transaction.id,
        vehicleId: transaction.vehicleId,
        vehicleBrand: transaction.vehicleBrand,
        vehicleModel: transaction.vehicleModel,
        price: transaction.price,
        buyerName: transaction.buyerName,
        buyerEmail: transaction.buyerEmail,
        buyerPhone: transaction.buyerPhone,
        date: transaction.date,
        paymentMethod: transaction.paymentMethod,
        cardNumber: transaction.cardNumber,
        status: transaction.status
      });

    if (error) {
      console.error('Supabase insertTransaction error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase insertTransaction failed:', err);
    return false;
  }
}

export async function deleteSupabaseTransaction(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase deleteTransaction error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase deleteTransaction failed:', err);
    return false;
  }
}

// --- NOTIFICATIONS API ---
export async function getSupabaseNotifications(): Promise<PushNotification[] | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('time', { ascending: false });

    if (error) {
      console.warn('Supabase getSupabaseNotifications error, falling back to localStorage:', error.message);
      return null;
    }
    return data as PushNotification[];
  } catch (err) {
    console.warn('Supabase notifications failed:', err);
    return null;
  }
}

export async function upsertSupabaseNotification(notification: PushNotification): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .upsert({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        time: notification.time,
        read: notification.read,
        type: notification.type,
        vehicleId: notification.vehicleId
      });

    if (error) {
      console.error('Supabase upsertNotification error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase upsertNotification failed:', err);
    return false;
  }
}

export async function deleteSupabaseNotification(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase deleteNotification error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase deleteNotification failed:', err);
    return false;
  }
}

// Seed helper to populate empty Supabase with defaults
export async function seedSupabaseDatabase(
  initialVehicles: Vehicle[],
  initialTransactions: Transaction[],
  initialNotifications: PushNotification[]
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Seed vehicles
  for (const v of initialVehicles) {
    const ok = await upsertSupabaseVehicle(v);
    if (!ok) errors.push(`Impossible de charger le véhicule ${v.brand} ${v.model}`);
  }

  // Seed transactions
  for (const tx of initialTransactions) {
    const ok = await insertSupabaseTransaction(tx);
    if (!ok) errors.push(`Impossible de charger la transaction ${tx.id}`);
  }

  // Seed notifications
  for (const n of initialNotifications) {
    const ok = await upsertSupabaseNotification(n);
    if (!ok) errors.push(`Impossible de charger la notification ${n.id}`);
  }

  return {
    success: errors.length === 0,
    errors
  };
}
