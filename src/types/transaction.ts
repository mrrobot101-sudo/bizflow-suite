export type PaymentMethod = 'cash' | 'mpesa';

export type ServiceType = 
  | 'printing'
  | 'photocopying'
  | 'scanning'
  | 'internet'
  | 'typing'
  | 'lamination'
  | 'binding'
  | 'passport_photo'
  | 'mpesa_services'
  | 'other';

export const SERVICE_LABELS: Record<ServiceType, string> = {
  printing: 'Printing',
  photocopying: 'Photocopying',
  scanning: 'Scanning',
  internet: 'Internet Browsing',
  typing: 'Typing / Editing',
  lamination: 'Lamination',
  binding: 'Binding',
  passport_photo: 'Passport Photos',
  mpesa_services: 'M-Pesa Services',
  other: 'Other',
};

export interface Transaction {
  id: string;
  customerName: string;
  phoneNumber: string;
  serviceType: ServiceType;
  paymentMethod: PaymentMethod;
  amount: number;
  date: string; // ISO string
  time: string; // HH:mm
  notes?: string;
  quantity?: number;
  mpesaCode?: string;
}
