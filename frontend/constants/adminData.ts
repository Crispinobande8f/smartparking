// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive' | 'maintenance';
  totalSlots: number;
  occupied: number;
  available: number;
  ratePerHour: number;
  color: string; // accent color for the lot
}

export interface ParkingSlotItem {
  id: string;
  lotId: string;
  slotCode: string;
  zone: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  plate?: string;
  driverName?: string;
  since?: string; // ISO start time if occupied
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'driver' | 'attendant' | 'admin' | 'county';
  online: boolean;
  avatarColor: string;
}

export interface Transaction {
  id: string;
  receiptCode: string;
  slot: string;
  duration: string;
  amount: number;
  phone: string;
  timestamp: string;
}

export interface RevenuePoint {
  label: string;
  value: number;
}

export interface LotRevenue {
  name: string;
  amount: number;
  color: string;
  maxAmount: number;
}

// ─── Parking Lots ─────────────────────────────────────────────────────────────

export const PARKING_LOTS: ParkingLot[] = [
  {
    id: 'lot-1',
    name: 'Nairobi CBD Lot A',
    address: 'Kenyatta Avenue, Nairobi',
    status: 'active',
    totalSlots: 60,
    occupied: 38,
    available: 22,
    ratePerHour: 100,
    color: '#00C48C',
  },
  {
    id: 'lot-2',
    name: 'Westlands Lot B',
    address: 'Westlands Road, Nairobi',
    status: 'active',
    totalSlots: 40,
    occupied: 22,
    available: 18,
    ratePerHour: 80,
    color: '#0F2D5E',
  },
  {
    id: 'lot-3',
    name: 'Upperhill Lot C',
    address: 'Hospital Road, Nairobi',
    status: 'active',
    totalSlots: 80,
    occupied: 55,
    available: 25,
    ratePerHour: 120,
    color: '#F5A623',
  },
  {
    id: 'lot-4',
    name: 'Juja Parking Lot',
    address: 'Thika Road, Juja',
    status: 'active',
    totalSlots: 50,
    occupied: 20,
    available: 30,
    ratePerHour: 60,
    color: '#6C63FF',
  },
  {
    id: 'lot-5',
    name: 'Moi Avenue Lot',
    address: 'Moi Avenue, Nairobi',
    status: 'maintenance',
    totalSlots: 35,
    occupied: 0,
    available: 35,
    ratePerHour: 90,
    color: '#E84040',
  },
];

// ─── Slots per lot ────────────────────────────────────────────────────────────

const makeSlots = (lotId: string, zones: string[], total: number): ParkingSlotItem[] => {
  const statuses: ParkingSlotItem['status'][] = ['available', 'occupied', 'reserved', 'maintenance'];
  const plates = ['KBZ 412G','KCG 230A','KDD 887K','KDA 554T','KBH 091F','KCA 001A','KDB 999Z'];
  const drivers = ['James Kamau','Grace Wanjiku','Peter Otieno','Mary Njeri','Ali Hassan'];
  const slots: ParkingSlotItem[] = [];
  let count = 0;
  for (const zone of zones) {
    for (let i = 1; i <= Math.ceil(total / zones.length); i++) {
      if (count >= total) break;
      const status = count % 5 === 0 ? 'available' : count % 7 === 0 ? 'reserved' : count % 11 === 0 ? 'maintenance' : 'occupied';
      slots.push({
        id: `${lotId}-${zone}${i}`,
        lotId,
        slotCode: `${zone}${i}`,
        zone: `Zone ${zone}`,
        status,
        plate: status === 'occupied' ? plates[count % plates.length] : undefined,
        driverName: status === 'occupied' ? drivers[count % drivers.length] : undefined,
        since: status === 'occupied' ? new Date(Date.now() - (count % 8 + 1) * 3600000).toISOString() : undefined,
      });
      count++;
    }
  }
  return slots;
};

export const LOT_SLOTS: Record<string, ParkingSlotItem[]> = {
  'lot-1': makeSlots('lot-1', ['A','B','C'], 60),
  'lot-2': makeSlots('lot-2', ['A','B'], 40),
  'lot-3': makeSlots('lot-3', ['A','B','C','D'], 80),
  'lot-4': makeSlots('lot-4', ['A','B'], 50),
  'lot-5': makeSlots('lot-5', ['A'], 35),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const USERS: User[] = [
  { id: '1', name: 'James Kamau',   email: 'driver@parksmart.io',    role: 'driver',    online: true,  avatarColor: '#00C48C' },
  { id: '2', name: 'Grace Wanjiku', email: 'attendant@parksmart.io', role: 'attendant', online: true,  avatarColor: '#F5A623' },
  { id: '3', name: 'David Mwangi',  email: 'admin@parksmart.io',     role: 'admin',     online: true,  avatarColor: '#8A94A6' },
  { id: '4', name: 'Amina Hassan',  email: 'county@parksmart.io',    role: 'county',    online: true,  avatarColor: '#6C63FF' },
  { id: '5', name: 'Peter Otieno',  email: 'peter@parksmart.io',     role: 'driver',    online: false, avatarColor: '#0F2D5E' },
  { id: '6', name: 'Mary Njeri',    email: 'mary@parksmart.io',      role: 'driver',    online: false, avatarColor: '#E84040' },
];

// ─── Transactions ─────────────────────────────────────────────────────────────

export const TRANSACTIONS: Transaction[] = [
  { id:'1', receiptCode:'QHX7K2P9AB', slot:'Parking Slot A5', duration:'1.5 hrs', amount:150, phone:'0712345678', timestamp:'2026-04-30T11:29:00' },
  { id:'2', receiptCode:'QHX8M3R1CD', slot:'Parking Slot D2', duration:'3 hrs',   amount:300, phone:'0723456789', timestamp:'2026-04-30T08:19:00' },
  { id:'3', receiptCode:'QHX9N4S2EF', slot:'Parking Slot B3', duration:'2 hrs',   amount:200, phone:'0734567890', timestamp:'2026-04-30T09:00:00' },
  { id:'4', receiptCode:'QHX0P5T3GH', slot:'Parking Slot C1', duration:'1 hr',    amount:100, phone:'0712345678', timestamp:'2026-04-30T07:45:00' },
  { id:'5', receiptCode:'QHX1Q6U4IJ', slot:'Parking Slot A2', duration:'2.5 hrs', amount:250, phone:'0745678901', timestamp:'2026-04-29T14:00:00' },
];

// ─── Revenue chart data ────────────────────────────────────────────────────────

export const WEEKLY_REVENUE: RevenuePoint[] = [
  { label:'M', value: 4200 },
  { label:'T', value: 5800 },
  { label:'W', value: 3900 },
  { label:'T', value: 7100 },
  { label:'F', value: 6500 },
  { label:'S', value: 8200 },
  { label:'S', value: 2900 },
];

export const MONTHLY_REVENUE: RevenuePoint[] = [
  { label:'Oct', value:12000 },{ label:'Oct', value:13500 },
  { label:'Nov', value:14200 },{ label:'Nov', value:13000 },
  { label:'Dec', value:11000 },{ label:'Dec', value:10500 },
  { label:'Jan', value:15000 },{ label:'Jan', value:16000 },
  { label:'Feb', value:14500 },{ label:'Feb', value:15500 },
  { label:'Mar', value:19000 },{ label:'Mar', value:18500 },
  { label:'Apr', value:5000  },
];

export const LOT_REVENUES: LotRevenue[] = [
  { name:'CBD Lot A',   amount:18500, color:'#00C48C', maxAmount:20000 },
  { name:'Westlands B', amount:12300, color:'#0F2D5E', maxAmount:20000 },
  { name:'Upperhill C', amount:17900, color:'#F5A623', maxAmount:20000 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function occupancyPct(lot: ParkingLot): number {
  return Math.round((lot.occupied / lot.totalSlots) * 100);
}

export function getElapsed(startTime: string): string {
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}