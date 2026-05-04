// ─── Types ───────────────────────────────────────────────────────────────────

export interface CountyLot {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive' | 'maintenance';
  totalSlots: number;
  occupied: number;
  reserved: number;
  available: number;
  ratePerHour: number;
  revenue: number;        // KES this month
  occupancyColor: string; // bar accent color
}

export interface VehicleInLot {
  id: string;
  lotId: string;
  plate: string;
  slotCode: string;
  zone: string;
  driverName: string;
  checkedInAt: string; // ISO
  status: 'active' | 'reserved' | 'overstay';
}

export interface Violation {
  id: string;
  plate: string;
  type: 'Overstay' | 'No Payment' | 'Wrong Zone' | 'Unauthorized';
  lot: string;
  time: string;
  fine: number;
  status: 'pending' | 'paid';
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
}

export interface LotRevenue {
  name: string;
  amount: number;
  occupancy: number; // %
  color: string;
}

// ─── County Parking Lots ─────────────────────────────────────────────────────

export const COUNTY_LOTS: CountyLot[] = [
  {
    id: 'lot-1',
    name: 'Nairobi CBD Lot A',
    address: 'Kenyatta Avenue, Nairobi',
    status: 'active',
    totalSlots: 60,
    occupied: 38,
    reserved: 10,
    available: 12,
    ratePerHour: 100,
    revenue: 18500,
    occupancyColor: '#F5A623',
  },
  {
    id: 'lot-2',
    name: 'Westlands Lot B',
    address: 'Westlands Road, Nairobi',
    status: 'active',
    totalSlots: 40,
    occupied: 22,
    reserved: 4,
    available: 14,
    ratePerHour: 80,
    revenue: 12300,
    occupancyColor: '#F5A623',
  },
  {
    id: 'lot-3',
    name: 'Upperhill Lot C',
    address: 'Hospital Road, Nairobi',
    status: 'active',
    totalSlots: 80,
    occupied: 55,
    reserved: 8,
    available: 17,
    ratePerHour: 120,
    revenue: 17900,
    occupancyColor: '#E84040',
  },
  {
    id: 'lot-4',
    name: 'Moi Avenue Lot D',
    address: 'Moi Avenue, Nairobi',
    status: 'active',
    totalSlots: 50,
    occupied: 20,
    reserved: 6,
    available: 24,
    ratePerHour: 90,
    revenue: 8200,
    occupancyColor: '#F5A623',
  },
  {
    id: 'lot-5',
    name: 'Juja Road Lot E',
    address: 'Thika Road, Juja',
    status: 'active',
    totalSlots: 35,
    occupied: 10,
    reserved: 3,
    available: 22,
    ratePerHour: 60,
    revenue: 4100,
    occupancyColor: '#00C48C',
  },
];

// ─── Vehicles currently in each lot ──────────────────────────────────────────

const makeVehicles = (lotId: string, count: number): VehicleInLot[] => {
  const plates = ['KBZ 412G','KCG 230A','KDD 887K','KDA 554T','KBH 091F',
                  'KCA 001A','KDB 999Z','KCB 123X','KBA 456Y','KCC 789W',
                  'KAD 321P','KBE 654Q','KAF 987R','KBG 159S','KAH 753T'];
  const drivers = ['James Kamau','Grace Wanjiku','Peter Otieno','Mary Njeri',
                   'Ali Hassan','Samuel Odhiambo','Faith Mwangi','John Kariuki',
                   'Rose Akinyi','David Mutua','Esther Wambui','Kevin Omondi'];
  const zones = ['A','B','C','D'];
  const statuses: VehicleInLot['status'][] = ['active','active','active','reserved','overstay'];
  return Array.from({ length: count }, (_, i) => ({
    id: `${lotId}-v${i}`,
    lotId,
    plate: plates[i % plates.length],
    slotCode: `${zones[Math.floor(i / 5) % zones.length]}${(i % 5) + 1}`,
    zone: `Zone ${zones[Math.floor(i / 5) % zones.length]}`,
    driverName: drivers[i % drivers.length],
    checkedInAt: new Date(Date.now() - (i + 1) * 3600000 * 0.8).toISOString(),
    status: statuses[i % statuses.length],
  }));
};

export const LOT_VEHICLES: Record<string, VehicleInLot[]> = {
  'lot-1': makeVehicles('lot-1', 38),
  'lot-2': makeVehicles('lot-2', 22),
  'lot-3': makeVehicles('lot-3', 55),
  'lot-4': makeVehicles('lot-4', 20),
  'lot-5': makeVehicles('lot-5', 10),
};

// ─── Violations ───────────────────────────────────────────────────────────────

export const VIOLATIONS: Violation[] = [
  { id:'v1', plate:'KBZ 412G', type:'Overstay',    lot:'CBD Lot A',    time:'08:30', fine:500,  status:'pending' },
  { id:'v2', plate:'KCG 230A', type:'No Payment',  lot:'Westlands B',  time:'09:15', fine:1000, status:'paid'    },
  { id:'v3', plate:'KDD 887K', type:'Wrong Zone',  lot:'Upperhill C',  time:'10:00', fine:300,  status:'pending' },
  { id:'v4', plate:'KBH 091F', type:'Overstay',    lot:'CBD Lot A',    time:'11:30', fine:500,  status:'paid'    },
  { id:'v5', plate:'KDA 554T', type:'No Payment',  lot:'Westlands B',  time:'12:45', fine:1000, status:'pending' },
];

// ─── Monthly Revenue (last 7 months) ─────────────────────────────────────────

export const MONTHLY_REVENUE: MonthlyRevenue[] = [
  { month:'Oct', amount:32000 },
  { month:'Nov', amount:38000 },
  { month:'Dec', amount:28000 },
  { month:'Jan', amount:45000 },
  { month:'Feb', amount:41000 },
  { month:'Mar', amount:52000 },
  { month:'Apr', amount:12000 },
];

// ─── Lot Revenue comparison ───────────────────────────────────────────────────

export const LOT_REVENUES: LotRevenue[] = [
  { name:'CBD Lot A',    amount:18500, occupancy:78, color:'#F5A623' },
  { name:'Westlands B',  amount:12300, occupancy:65, color:'#F5A623' },
  { name:'Upperhill C',  amount:17900, occupancy:82, color:'#E84040' },
  { name:'Moi Ave D',    amount:8200,  occupancy:52, color:'#F5A623' },
  { name:'Juja Road E',  amount:4100,  occupancy:37, color:'#00C48C' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function pct(part: number, total: number): string {
  return `${Math.round((part / total) * 100)}%`;
}

export function pctNum(part: number, total: number): number {
  return Math.round((part / total) * 100);
}

export function getElapsed(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function totalRevenue(lots: CountyLot[]): number {
  return lots.reduce((s, l) => s + l.revenue, 0);
}