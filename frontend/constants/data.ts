export type SlotStatus = 'free' | 'taken' | 'reserved' | 'leaving';

export interface ParkingSlot {
  id: string;
  zone: string;
  number: number;
  status: SlotStatus;
}

export interface BookingRecord {
  id: string;
  slot: string;
  zone: string;
  plate: string;
  status: 'active' | 'completed';
  time: string;
  amount?: number;
  receipt?: string;
}

export interface ActiveSession {
  id: string;
  plate: string;
  slot: string;
  driver: string;
  duration: string;
  amount: number;
}

export const PARKING_SLOTS: ParkingSlot[] = [
  // Zone A
  { id: 'A1', zone: 'A', number: 1, status: 'free' },
  { id: 'A2', zone: 'A', number: 2, status: 'taken' },
  { id: 'A3', zone: 'A', number: 3, status: 'free' },
  { id: 'A4', zone: 'A', number: 4, status: 'reserved' },
  { id: 'A5', zone: 'A', number: 5, status: 'taken' },
  { id: 'A6', zone: 'A', number: 6, status: 'free' },
  // Zone B
  { id: 'B1', zone: 'B', number: 1, status: 'taken' },
  { id: 'B2', zone: 'B', number: 2, status: 'free' },
  { id: 'B3', zone: 'B', number: 3, status: 'free' },
  { id: 'B4', zone: 'B', number: 4, status: 'leaving' },
  { id: 'B5', zone: 'B', number: 5, status: 'taken' },
  { id: 'B6', zone: 'B', number: 6, status: 'reserved' },
  // Zone C
  { id: 'C1', zone: 'C', number: 1, status: 'free' },
  { id: 'C2', zone: 'C', number: 2, status: 'free' },
  { id: 'C3', zone: 'C', number: 3, status: 'taken' },
  { id: 'C4', zone: 'C', number: 4, status: 'free' },
  { id: 'C5', zone: 'C', number: 5, status: 'taken' },
  { id: 'C6', zone: 'C', number: 6, status: 'free' },
  // Zone D
  { id: 'D1', zone: 'D', number: 1, status: 'taken' },
  { id: 'D2', zone: 'D', number: 2, status: 'free' },
  { id: 'D3', zone: 'D', number: 3, status: 'free' },
  { id: 'D4', zone: 'D', number: 4, status: 'reserved' },
  { id: 'D5', zone: 'D', number: 5, status: 'free' },
  { id: 'D6', zone: 'D', number: 6, status: 'taken' },
];

export const BOOKING_HISTORY: BookingRecord[] = [
  { id: '1', slot: 'A2', zone: 'Zone A', plate: 'KBZ 412G', status: 'active', time: '30/4 10:04' },
  { id: '2', slot: 'B1', zone: 'Zone B', plate: 'KCG 230A', status: 'active', time: '30/4 08:49' },
  { id: '3', slot: 'C3', zone: 'Zone C', plate: 'KDD 887K', status: 'active', time: '30/4 10:34' },
  { id: '4', slot: 'A5', zone: 'Zone A', plate: 'KDA 554T', status: 'completed', time: '30/4 11:29', amount: 150, receipt: 'QHX7K2P9AB' },
  { id: '5', slot: 'D2', zone: 'Zone D', plate: 'KBH 091F', status: 'completed', time: '30/4 08:19', amount: 300, receipt: 'QHX8M3R1CD' },
];

export const ACTIVE_SESSIONS: ActiveSession[] = [
  { id: '1', plate: 'KBZ 412G', slot: 'Slot A2', driver: 'James Kamau', duration: '6h 21m', amount: 635 },
  { id: '2', plate: 'KCG 230A', slot: 'Slot B1', driver: 'Grace Wanjiku', duration: '7h 36m', amount: 760 },
  { id: '3', plate: 'KDD 887K', slot: 'Slot C3', driver: 'Peter Otieno', duration: '5h 51m', amount: 585 },
];

export const DEMO_ACCOUNTS = [
  { role: 'Driver', email: 'driver@parksmart.io', password: 'demo1234', color: '#00C896' },
  { role: 'Attendant', email: 'attendant@parksmart.io', password: 'demo1234', color: '#F4A261' },
  { role: 'Admin', email: 'admin@parksmart.io', password: 'demo1234', color: '#3A86FF' },
  { role: 'County', email: 'county@parksmart.io', password: 'demo1234', color: '#6B7280' },
];