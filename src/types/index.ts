import { Timestamp } from 'firebase/firestore';

// ---------- User ----------
export interface AppUser {
  uid: string;
  phone: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  city: string;
  area: string;
  bio: string;
  photoUrl: string | null;
  isVerified: boolean;
  profileComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------- Crew ----------
export interface Crew {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  vibeTag: string;
  maxMembers: number;
  memberCount: number;
  genderPreference: 'any' | 'women_only';
  adminUid: string;
  adminName: string;
  adminPhotoUrl: string | null;
  inviteCode: string;
  memberUids: string[];
  lastMessage: string | null;
  lastMessageAt: Timestamp | null;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface CrewMember {
  uid: string;
  name: string;
  photoUrl: string | null;
  role: 'admin' | 'member';
  joinedAt: Timestamp;
}

export interface JoinRequest {
  uid: string;
  name: string;
  photoUrl: string | null;
  age: number | null;
  bio: string | null;
  message: string | null;
  requestedAt: Timestamp;
}

// ---------- Photographer ----------
export interface Photographer {
  id: string;
  name: string;
  photoUrl: string | null;
  city: string;
  serviceAreas: string[];
  bio: string;
  portfolioUrls: string[];
  rating: number;
  totalBookings: number;
  isVerified: boolean;
  isActive: boolean;
  startingPrice: number;
  createdAt: Timestamp;
}

export interface PhotographerPackage {
  id: string;
  photographerId: string;
  name: string;
  durationHours: number;
  deliverables: Record<string, any>;
  price: number;
  isActive: boolean;
}