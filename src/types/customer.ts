export interface Customer {
  id: string;
  name: string;
  phone: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  address?: string;
  registeredAt: string;
  membershipType: 'fitness' | 'golf' | 'tennis' | 'combo' | 'other';
  membershipStart?: string;
  membershipEnd?: string;
  ptCount?: number;
  otCount?: number;
  lessonCount?: number;
  consultingHistory?: ConsultingRecord[];
  consultant?: string;
  status: 'active' | 'expired' | 'paused' | 'withdrawn';
  notes?: string;
  marketingConsent?: boolean;
  lastVisitDate?: string;
  registerSource?: 'offline' | 'online' | 'referral' | 'other' | 'phone' | 'membership' | 'consulting' | 'inquiry' | 'visit';
  profileImageUrl?: string;
}

export interface ConsultingRecord {
  date: string;
  content: string;
  consultant: string;
} 