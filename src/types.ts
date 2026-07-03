export interface Vehicle {
  id: string;
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  image?: string;
  images?: string[]; // Multiple image URLs or Base64 strings
  description?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  status: 'available' | 'sold';
  createdAt: string;
}

export interface Transaction {
  id: string;
  vehicleId: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  price: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  date: string;
  paymentMethod: string;
  cardNumber: string; // Obfuscated or last 4
  status: 'success' | 'pending';
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'new_listing' | 'promo' | 'system' | 'sale';
  vehicleId?: string;
}
