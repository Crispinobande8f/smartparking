// ─── Types ───────────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  plate: string;
  driverName: string;
  phone: string;
  slot: string;
  zone: string;
  bookedAt: string;       // ISO - when they booked
  expectedArrival: string; // ISO - expected check-in time
  depositPaid: number;    // KES deposit already paid online
  ratePerHour: number;
  status: 'pending_checkin' | 'checked_in' | 'completed';
}

export interface ActiveSession {
  id: string;
  plate: string;
  driverName: string;
  phone: string;
  slot: string;
  zone: string;
  checkedInAt: string;    // ISO - actual check-in time
  depositPaid: number;    // KES deposit already paid
  ratePerHour: number;
  checkoutRequested: boolean; // true if driver tapped "Request Checkout" in their app
  checkoutRequestedAt?: string; // ISO - when they requested
}

// ─── Mock Reservations (pending check-in) ────────────────────────────────────

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    plate: 'KBZ 412G',
    driverName: 'James Kamau',
    phone: '0712 345 678',
    slot: 'A2',
    zone: 'Zone A',
    bookedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    expectedArrival: new Date(Date.now() + 10 * 60000).toISOString(),
    depositPaid: 200,
    ratePerHour: 100,
    status: 'pending_checkin',
  },
  {
    id: 'res-2',
    plate: 'KCG 230A',
    driverName: 'Grace Wanjiku',
    phone: '0723 456 789',
    slot: 'B3',
    zone: 'Zone B',
    bookedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    expectedArrival: new Date(Date.now() + 5 * 60000).toISOString(),
    depositPaid: 150,
    ratePerHour: 100,
    status: 'pending_checkin',
  },
  {
    id: 'res-3',
    plate: 'KDD 887K',
    driverName: 'Peter Otieno',
    phone: '0734 567 890',
    slot: 'C1',
    zone: 'Zone C',
    bookedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    expectedArrival: new Date(Date.now() + 20 * 60000).toISOString(),
    depositPaid: 100,
    ratePerHour: 100,
    status: 'pending_checkin',
  },
  {
    id: 'res-4',
    plate: 'KDA 554T',
    driverName: 'Mary Njeri',
    phone: '0745 678 901',
    slot: 'A5',
    zone: 'Zone A',
    bookedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    expectedArrival: new Date(Date.now() + 15 * 60000).toISOString(),
    depositPaid: 200,
    ratePerHour: 100,
    status: 'pending_checkin',
  },
  {
    id: 'res-5',
    plate: 'KBH 091F',
    driverName: 'Ali Hassan',
    phone: '0756 789 012',
    slot: 'D4',
    zone: 'Zone D',
    bookedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    expectedArrival: new Date(Date.now() + 30 * 60000).toISOString(),
    depositPaid: 150,
    ratePerHour: 100,
    status: 'pending_checkin',
  },
];

// ─── Mock Active Sessions (for checkout) ─────────────────────────────────────

export const MOCK_ACTIVE_SESSIONS: ActiveSession[] = [
  // Checkout requested — these appear at the TOP
  {
    id: 'sess-1',
    plate: 'KBZ 412G',
    driverName: 'James Kamau',
    phone: '0712 345 678',
    slot: 'A2',
    zone: 'Zone A',
    checkedInAt: new Date(Date.now() - 6 * 3600000 - 21 * 60000).toISOString(),
    depositPaid: 200,
    ratePerHour: 100,
    checkoutRequested: true,
    checkoutRequestedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'sess-2',
    plate: 'KCG 230A',
    driverName: 'Grace Wanjiku',
    phone: '0723 456 789',
    slot: 'B1',
    zone: 'Zone B',
    checkedInAt: new Date(Date.now() - 7 * 3600000 - 36 * 60000).toISOString(),
    depositPaid: 150,
    ratePerHour: 100,
    checkoutRequested: true,
    checkoutRequestedAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 'sess-3',
    plate: 'KDD 887K',
    driverName: 'Peter Otieno',
    phone: '0734 567 890',
    slot: 'C3',
    zone: 'Zone C',
    checkedInAt: new Date(Date.now() - 5 * 3600000 - 51 * 60000).toISOString(),
    depositPaid: 100,
    ratePerHour: 100,
    checkoutRequested: true,
    checkoutRequestedAt: new Date(Date.now() - 1 * 60000).toISOString(),
  },
  // Still parked — no checkout request
  {
    id: 'sess-4',
    plate: 'KDA 554T',
    driverName: 'Mary Njeri',
    phone: '0745 678 901',
    slot: 'A5',
    zone: 'Zone A',
    checkedInAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    depositPaid: 200,
    ratePerHour: 100,
    checkoutRequested: false,
  },
  {
    id: 'sess-5',
    plate: 'KBH 091F',
    driverName: 'Ali Hassan',
    phone: '0756 789 012',
    slot: 'D4',
    zone: 'Zone D',
    checkedInAt: new Date(Date.now() - 2 * 3600000 - 15 * 60000).toISOString(),
    depositPaid: 150,
    ratePerHour: 100,
    checkoutRequested: false,
  },
  {
    id: 'sess-6',
    plate: 'KCA 001A',
    driverName: 'Samuel Odhiambo',
    phone: '0767 890 123',
    slot: 'B5',
    zone: 'Zone B',
    checkedInAt: new Date(Date.now() - 1 * 3600000 - 45 * 60000).toISOString(),
    depositPaid: 100,
    ratePerHour: 100,
    checkoutRequested: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns elapsed time as "6h 21m" */
export function getElapsed(startTime: string): string {
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Returns total KES owed based on time parked */
export function getTotalBill(checkedInAt: string, ratePerHour: number): number {
  const hours = (Date.now() - new Date(checkedInAt).getTime()) / 3600000;
  return Math.round(hours * ratePerHour);
}

/** Returns balance due after deposit */
export function getBalance(checkedInAt: string, ratePerHour: number, deposit: number): number {
  const total = getTotalBill(checkedInAt, ratePerHour);
  return Math.max(0, total - deposit);
}

/** Format ISO to "30/4 10:04" */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/** Minutes until expected arrival (can be negative = late) */
export function minutesUntilArrival(expectedArrival: string): number {
  return Math.round((new Date(expectedArrival).getTime() - Date.now()) / 60000);
}