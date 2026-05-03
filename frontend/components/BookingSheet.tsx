import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlotInfo {
  id: number;
  number: string;   // e.g. "C4"
  zone: string;     // e.g. "C"
  ratePerHour: number;
}

type Sheet = 'duration' | 'payment' | 'processing' | 'success' | 'error';

interface Props {
  visible: boolean;
  slot: SlotInfo;
  userPhone?: string;
  onClose: () => void;
  onConfirmed?: (bookingRef: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DURATIONS = [1, 2, 3, 4, 6, 8];
const { height: SCREEN_H } = Dimensions.get('window');

const C = {
  navy:       '#0D1B40',
  navyLight:  '#1A2B5F',
  teal:       '#00C896',
  tealDark:   '#00A57A',
  tealGlow:   'rgba(0,200,150,0.18)',
  white:      '#FFFFFF',
  offWhite:   '#F4F6FB',
  glass:      'rgba(255,255,255,0.10)',
  glassBorder:'rgba(255,255,255,0.22)',
  red:        '#FF4D4D',
  redGlow:    'rgba(255,77,77,0.18)',
  textMain:   '#0D1B40',
  textSub:    '#6B7A99',
  cardBg:     'rgba(255,255,255,0.72)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKES(n: number) {
  return `KES ${n.toLocaleString()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Glassmorphic pill for zone/rate info */
function GlassPill({ label }: { label: string }) {
  return (
    <View style={styles.glassPill}>
      <Text style={styles.glassPillText}>{label}</Text>
    </View>
  );
}

/** Single duration option chip */
function DurationChip({
  hours,
  selected,
  onPress,
}: {
  hours: number;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(scale, { toValue: 1,    duration: 160, useNativeDriver: true, easing: Easing.out(Easing.back(2)) }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.durationChip, selected && styles.durationChipSelected]}
      >
        <Text style={[styles.durationChipNum, selected && styles.durationChipNumSel]}>
          {hours}
        </Text>
        <Text style={[styles.durationChipUnit, selected && styles.durationChipUnitSel]}>
          hr
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Animated success checkmark */
function SuccessCheck() {
  const scale  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.checkCircle, { transform: [{ scale }], opacity }]}>
      <Text style={styles.checkMark}>✓</Text>
    </Animated.View>
  );
}

/** Animated error X */
function ErrorIcon() {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60,  useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8,   duration: 50,  useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8,  duration: 50,  useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 50,  useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.errorCircle, { transform: [{ translateX: shake }] }]}>
      <Text style={styles.errorMark}>✕</Text>
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingSheet({
  visible,
  slot,
  userPhone = '',
  onClose,
  onConfirmed,
}: Props) {
  const [sheet,        setSheet]    = useState<Sheet>('duration');
  const [hours,        setHours]    = useState(1);
  const [phone,        setPhone]    = useState(userPhone);
  const [bookingRef,   setBookingRef] = useState('');
  const [errorMsg,     setErrorMsg] = useState('');

  // Sheet slide-up animation
  const slideY = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    if (visible) {
      setSheet('duration');
      setHours(1);
      Animated.spring(slideY, {
        toValue: 0,
        friction: 14,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: SCREEN_H,
        duration: 260,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const totalAmount  = hours * slot.ratePerHour;
  // Advance = 25% of total, min 50 KES
  const advanceFee   = Math.max(50, Math.round(totalAmount * 0.25));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleProceedToPayment = () => {
    setSheet('payment');
  };

  const handlePay = async () => {
    if (!phone.match(/^07\d{8}$/)) {
      setErrorMsg('Enter a valid Safaricom number (07XXXXXXXX)');
      return;
    }
    setErrorMsg('');
    setSheet('processing');

    try {
      // Replace with your actual API call
      const res = await fetch('https://your-api.com/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer YOUR_TOKEN' },
        body: JSON.stringify({
          slot_id:            slot.id,
          phone,
          expected_arrival:   new Date(Date.now() + 30 * 60000).toISOString(),
          expected_departure: new Date(Date.now() + (30 + hours * 60) * 60000).toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Booking failed');
      const data = await res.json();
      setBookingRef(data.booking?.booking_reference ?? 'BK-DEMO001');
      setSheet('success');
      onConfirmed?.(bookingRef);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Something went wrong');
      setSheet('error');
    }
  };

  const handleClose = useCallback(() => {
    setSheet('duration');
    onClose();
  }, [onClose]);

  // ── Render sheets ────────────────────────────────────────────────────────────

  const renderDuration = () => (
    <View>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <View style={styles.slotIconBadge}>
          <Text style={styles.slotIconText}>P</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetTitle}>Book Slot {slot.number}</Text>
          <View style={styles.sheetSubRow}>
            <GlassPill label={`Zone ${slot.zone}`} />
            <GlassPill label={`KES ${slot.ratePerHour}/hr`} />
          </View>
        </View>
      </View>

      {/* Duration picker */}
      <Text style={styles.sectionLabel}>Select Duration</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map(h => (
          <DurationChip key={h} hours={h} selected={hours === h} onPress={() => setHours(h)} />
        ))}
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryTotal}>{formatKES(totalAmount)}</Text>
        </View>
        <View style={styles.summaryRight}>
          <View style={styles.mpesaTag}>
            <Text style={styles.mpesaIcon}>📱</Text>
            <View>
              <Text style={styles.mpesaLabel}>M-Pesa</Text>
              <Text style={styles.mpesaPhone}>{phone || '07XXXXXXXX'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Advance note */}
      <View style={styles.advanceNote}>
        <Text style={styles.advanceNoteText}>
          💡 Pay <Text style={styles.advanceNoteAmount}>{formatKES(advanceFee)}</Text> now to confirm. Balance due at checkout.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaButton} activeOpacity={0.88} onPress={handleProceedToPayment}>
        <Text style={styles.ctaButtonText}>📱  Continue to Payment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPayment = () => (
    <View>
      <TouchableOpacity style={styles.backBtn} onPress={() => setSheet('duration')}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.sheetTitle}>M-Pesa Payment</Text>
      <Text style={styles.paymentSubtitle}>
        An STK push will be sent to your phone. Enter your M-Pesa PIN to confirm.
      </Text>

      {/* Amount row */}
      <View style={styles.paymentAmountCard}>
        <View>
          <Text style={styles.paymentAmountLabel}>Advance to pay now</Text>
          <Text style={styles.paymentAmount}>{formatKES(advanceFee)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.paymentAmountLabel}>Total booking</Text>
          <Text style={styles.paymentAmountSub}>{formatKES(totalAmount)}</Text>
        </View>
      </View>

      {/* Phone input */}
      <Text style={styles.sectionLabel}>M-Pesa Number</Text>
      <View style={[styles.phoneInputWrap, errorMsg ? styles.inputError : null]}>
        <Text style={styles.phoneFlag}>🇰🇪 +254</Text>
        <TextInput
          style={styles.phoneInput}
          value={phone}
          onChangeText={setPhone}
          placeholder="07XXXXXXXX"
          placeholderTextColor={C.textSub}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>
      {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      {/* Slot summary */}
      <View style={styles.slotSummaryRow}>
        <Text style={styles.slotSummaryItem}>🅿️  Slot {slot.number}</Text>
        <Text style={styles.slotSummaryItem}>⏱  {hours} hr{hours > 1 ? 's' : ''}</Text>
        <Text style={styles.slotSummaryItem}>📍  Zone {slot.zone}</Text>
      </View>

      <TouchableOpacity style={styles.ctaButton} activeOpacity={0.88} onPress={handlePay}>
        <Text style={styles.ctaButtonText}>💳  Pay {formatKES(advanceFee)} via M-Pesa</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.centeredState}>
      <View style={styles.processingRing}>
        <ActivityIndicator size="large" color={C.teal} />
      </View>
      <Text style={styles.stateTitle}>Awaiting Payment</Text>
      <Text style={styles.stateSubtitle}>Check your phone for the M-Pesa prompt and enter your PIN.</Text>
      <View style={styles.processingPhone}>
        <Text style={styles.processingPhoneText}>📱  {phone}</Text>
      </View>
    </View>
  );

  const renderSuccess = () => {
    const checkinTime = new Date(Date.now() + 30 * 60000);
    const fmt = (d: Date) => d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.centeredState}>
        <SuccessCheck />
        <Text style={styles.stateTitle}>Booking Confirmed!</Text>
        <Text style={styles.stateSubtitle}>Your slot is reserved. Head over within 30 minutes.</Text>

        <View style={styles.successCard}>
          <View style={styles.successRow}>
            <Text style={styles.successRowLabel}>Slot</Text>
            <Text style={styles.successRowValue}>{slot.number} · Zone {slot.zone}</Text>
          </View>
          <View style={styles.successDivider} />
          <View style={styles.successRow}>
            <Text style={styles.successRowLabel}>Check-in by</Text>
            <Text style={[styles.successRowValue, { color: C.teal }]}>{fmt(checkinTime)}</Text>
          </View>
          <View style={styles.successDivider} />
          <View style={styles.successRow}>
            <Text style={styles.successRowLabel}>Duration</Text>
            <Text style={styles.successRowValue}>{hours} hr{hours > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.successDivider} />
          <View style={styles.successRow}>
            <Text style={styles.successRowLabel}>Ref</Text>
            <Text style={styles.successRowValue}>{bookingRef}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.88} onPress={handleClose}>
          <Text style={styles.ctaButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderError = () => (
    <View style={styles.centeredState}>
      <ErrorIcon />
      <Text style={styles.stateTitle}>Payment Failed</Text>
      <Text style={styles.stateSubtitle}>{errorMsg || 'The M-Pesa request was cancelled or timed out.'}</Text>

      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: C.teal, marginTop: 32 }]}
        activeOpacity={0.88}
        onPress={() => { setErrorMsg(''); setSheet('payment'); }}
      >
        <Text style={styles.ctaButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.7} onPress={handleClose}>
        <Text style={styles.ghostBtnText}>Cancel Booking</Text>
      </TouchableOpacity>
    </View>
  );

  const sheetContent: Record<Sheet, () => React.ReactNode> = {
    duration:   renderDuration,
    payment:    renderPayment,
    processing: renderProcessing,
    success:    renderSuccess,
    error:      renderError,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      {/* Backdrop blur */}
      <Pressable style={styles.backdrop} onPress={sheet === 'processing' ? undefined : handleClose}>
        <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {sheetContent[sheet]?.()}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Layout
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,15,35,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.offWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: SCREEN_H * 0.88,
    // Glass shimmer border at top
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Header
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  slotIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 6,
  },
  slotIconText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 22,
    color: C.white,
  },
  sheetTitle: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 20,
    color: C.textMain,
    marginBottom: 4,
  },
  sheetSubRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Glass pill
  glassPill: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    //backgroundColor: 'rgba(13,27,64,0.08)',
  },
  glassPillText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 11,
    color: C.navyLight,
  },

  // Duration
  sectionLabel: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 13,
    color: C.textSub,
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  durationChip: {
    width: 52,
    height: 58,
    borderRadius: 16,
    backgroundColor: C.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  durationChipSelected: {
    backgroundColor: C.navy,
    borderColor: C.navy,
    shadowColor: C.navy,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  durationChipNum: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 18,
    color: C.textMain,
  },
  durationChipNumSel: { color: C.white },
  durationChipUnit: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 11,
    color: C.textSub,
  },
  durationChipUnitSel: { color: 'rgba(255,255,255,0.65)' },

  // Summary card
  summaryCard: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: C.textSub,
    marginBottom: 4,
  },
  summaryTotal: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 26,
    color: C.textMain,
  },
  summaryRight: { alignItems: 'flex-end' },
  mpesaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.tealGlow,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mpesaIcon: { fontSize: 18 },
  mpesaLabel: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
    color: C.tealDark,
  },
  mpesaPhone: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 11,
    color: C.textSub,
  },

  // Advance note
  advanceNote: {
    backgroundColor: 'rgba(0,200,150,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.18)',
  },
  advanceNoteText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: C.textMain,
    lineHeight: 19,
  },
  advanceNoteAmount: {
    fontFamily: 'Lexend_700Bold',
    color: C.tealDark,
  },

  // CTA
  ctaButton: {
    backgroundColor: C.teal,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaButtonText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 16,
    color: C.white,
    letterSpacing: 0.3,
  },

  // Payment sheet
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  backBtnText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    color: C.textSub,
  },
  paymentSubtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: C.textSub,
    marginBottom: 20,
    lineHeight: 20,
  },
  paymentAmountCard: {
    backgroundColor: C.navy,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  paymentAmountLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
  },
  paymentAmount: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 26,
    color: C.teal,
  },
  paymentAmountSub: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 16,
    marginBottom: 8,
    height: 54,
    gap: 10,
  },
  inputError: { borderColor: C.red },
  phoneFlag: { fontSize: 16, fontFamily: 'Lexend_400Regular', color: C.textMain },
  phoneInput: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: C.textMain,
  },
  errorText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: C.red,
    marginBottom: 12,
  },
  slotSummaryRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
    marginTop: 8,
  },
  slotSummaryItem: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: C.textSub,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  // Processing / centered states
  centeredState: { alignItems: 'center', paddingVertical: 16 },
  processingRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.tealGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stateTitle: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 22,
    color: C.textMain,
    marginBottom: 10,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: C.textSub,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  processingPhone: {
    marginTop: 20,
    backgroundColor: C.tealGlow,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  processingPhoneText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 15,
    color: C.tealDark,
  },

  // Success
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  checkMark: { fontSize: 38, color: C.white },
  successCard: {
    width: '100%',
    backgroundColor: C.cardBg,
    borderRadius: 20,
    padding: 18,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  successRowLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: C.textSub,
  },
  successRowValue: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 14,
    color: C.textMain,
  },
  successDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  // Error
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.redGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: C.red,
  },
  errorMark: { fontSize: 34, color: C.red },
  ghostBtn: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    color: C.textSub,
  },
});
