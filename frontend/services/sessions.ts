import { apiFetch } from '../constants/api';

export interface ActiveSession {
  id: number;
  session_id: string;
  booking_reference: string; 
  plate: string;
  driver_name: string;
  slot: string;
  zone: string;
  checkin_time: string;   // ISO string
  hourly_rate: number;
  advance_paid: number;
  checkout_requested: boolean;
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

export async function fetchActiveSessions(): Promise<ActiveSession[]> {
  return apiFetch('/attendant/sessions');
}

export async function searchSessionByRef(ref: string): Promise<ActiveSession | null> {
  try {
    const sessions: ActiveSession[] = await apiFetch('/attendant/sessions');

    const normalised = ref.trim().toUpperCase();

    const match = sessions.find(
      (s) =>
        s.booking_reference?.toUpperCase() === normalised ||
        s.plate?.replace(/\s/g, '').toUpperCase() === normalised.replace(/\s/g, '')
    );

    return match ?? null;
  } catch (e: any) {
    throw e;
  }
}

export async function fetchCheckoutPreview(sessionId: string): Promise<CheckoutPreview> {
  return apiFetch(`/sessions/${sessionId}/checkout-preview`);
}

/** POST /v1/sessions/{session_id}/checkout */
export async function confirmCheckoutSession(sessionId: string): Promise<{
  message: string;
  billing?: { total_fee: number };
  checkout_at?: string;
  checkout_request_id?: string; 
}> {
  return apiFetch(`/sessions/${sessionId}/checkout`, { method: 'POST' });
}