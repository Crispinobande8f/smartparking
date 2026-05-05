import { apiFetch } from "./api";

export interface ActiveSession {
  id: string;
  plate: string;
  driverName: string;
  slot: string;
  zone: string;
  startTime: string; 
  ratePerHour: number;
}

export interface CheckoutPreview {
  session_id: string;
  checkin_time: string;
  total_duration_minutes: number;
  base_fee: number;
  late_fee: number;
  total_fee: number;
  advance_paid: number;
  balance_due: number;
  is_overtime: boolean;
}

export interface BookingHistoryItem {
  id: string;
  slot: string;
  zone: string;
  plate: string;
  startTime: string;
  status: 'active' | 'completed' | 'cancelled';
  amount?: number;
  receiptCode?: string;
}

export async function searchSessionByPlate(plate: string): Promise<ActiveSession | null> {
  try {
    const cleanPlate = plate.trim().replace(/\s+/g, ' ').toUpperCase();
    const data = await apiFetch(`/sessions?plate=${encodeURIComponent(cleanPlate)}`);

    return {
      id:          data.session_id,
      plate:       data.vehicle_plate,
      driverName:  data.driver_name,
      slot:        data.slot,
      zone:        data.slot_type ?? 'Standard',
      startTime:   data.checkin_time,
      ratePerHour: data.rate_per_hour ?? 100,
    };
  } catch (e: any) {
    if (e.message?.includes('404') || e.message?.toLowerCase().includes('not found')) {
      return null; 
    }
    throw e; 
  }
}

/** GET /v1/sessions/{id}/checkout-preview */
export async function fetchCheckoutPreview(sessionId: string): Promise<CheckoutPreview> {
  return apiFetch(`/sessions/${sessionId}/checkout-preview`);
}

/** POST /v1/sessions/{id}/checkout */
export async function confirmCheckout(sessionId: string): Promise<{ message: string; total_fee: number; checkout_at: string }> {
  return apiFetch(`/sessions/${sessionId}/checkout`, { method: 'POST' });
}


export const MOCK_HISTORY: BookingHistoryItem[] = [
  {
    id: '1',
    slot: 'A2',
    zone: 'Zone A',
    plate: 'KBZ 412G',
    startTime: '2026-04-30T10:04:00',
    status: 'active',
  },
  {
    id: '2',
    slot: 'B1',
    zone: 'Zone B',
    plate: 'KCG 230A',
    startTime: '2026-04-30T08:49:00',
    status: 'active',
  },
  {
    id: '3',
    slot: 'C3',
    zone: 'Zone C',
    plate: 'KDD 887K',
    startTime: '2026-04-30T10:34:00',
    status: 'active',
  },
  {
    id: '4',
    slot: 'A5',
    zone: 'Zone A',
    plate: 'KDA 554T',
    startTime: '2026-04-30T11:29:00',
    status: 'completed',
    amount: 150,
    receiptCode: 'QHX7K2P9AB',
  },
  {
    id: '5',
    slot: 'D2',
    zone: 'Zone D',
    plate: 'KBH 091F',
    startTime: '2026-04-30T08:19:00',
    status: 'completed',
    amount: 300,
    receiptCode: 'QHX8M3R1CD',
  },
];

export const AVAILABLE_SLOTS = [
  'A1','A3','A6','B2','B3',
  'C1','C2','C4','C6','D2',
  'D3','D5',
];

// Compute elapsed time string from ISO start time
export function getElapsed(startTime: string): string {
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}

// Compute KES amount from start time at rate/hr
export function getAmount(startTime: string, ratePerHour: number): number {
  const hours = (Date.now() - new Date(startTime).getTime()) / 3600000;
  return Math.round(hours * ratePerHour);
}

// Format date string to "30/4 10:04"
export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}