/**
 * CheckInScreen.tsx
 * Screen: Attendant vehicle check-in — booking reference lookup → confirm
 * Route: app/(attendant)/checkin.tsx
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Animated, StatusBar, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, scale } from '@/constants/theme';
import { apiFetch } from '@/constants/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BookingPreview {
  booking_reference: string;
  driver_name: string;
  slot_number: string;
  slot_type: string;
  expected_arrival: string;
  expected_departure: string;
  advance_fee_paid: number;
  booking_status: string;
}

// ─── Info Row (shown in the preview card) ────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconBox}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={infoStyles.content}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  content: {
    flex: 1,
  },
  label: { fontSize: scale(11), color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: scale(15), fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CheckInScreen() {
  const [bookingRef, setBookingRef]       = useState('');
  const [preview, setPreview]             = useState<BookingPreview | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError]                 = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Animate preview card in when booking is found
  useEffect(() => {
    if (preview) {
      cardAnim.setValue(0);
      Animated.spring(cardAnim, {
        toValue: 1, useNativeDriver: true, damping: 20, stiffness: 120,
      }).start();
    }
  }, [preview]);

  // ── Step 1: Look up the booking by reference ──────────────────────────────
  const handleLookup = async () => {
    const ref = bookingRef.trim().toUpperCase();
    if (!ref) {
      setError('Please enter a booking reference');
      return;
    }

    setError('');
    setPreview(null);
    setLookupLoading(true);

    try {
      // GET /v1/bookings?reference=BK-XXXXXXXX
      // Backend should return 404 if not found, 200 with booking data if found
      const data = await apiFetch(`/bookings/${encodeURIComponent(ref)}`);
      const booking = data.booking
      const currentStatus = booking.booking_status;

      if (currentStatus === 'checked_in') {
        setError('This booking has already been checked in.');
        return;
      }
      if (currentStatus === 'completed') {
        setError('This booking is already completed.');
        return;
      }
      if (currentStatus !== 'confirmed') {
        setError(`Cannot check in — booking status is "${currentStatus}".`);
        return;
      }

      setPreview(booking);
    } catch (err: any) {
      if (err?.status === 404) {
        setError(`No booking found for reference "${ref}".`);
      } else if (err?.status === 422) {
        setError(err?.message ?? 'Booking is outside the check-in window.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Step 2: Confirm the check-in ─────────────────────────────────────────
  const handleConfirmCheckIn = async () => {
    if (!preview) return;
    setConfirmLoading(true);

    try {
      await apiFetch('/attendant/checkin', {
        method: 'POST',
        body: JSON.stringify({ booking_reference: preview.booking_reference }),
      });

      Alert.alert(
        'Check-In Successful',
        `${preview.driver_name} — Slot ${preview.slot_number} is now active.`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (err: any) {
      if (err?.status === 422) {
        Alert.alert('Cannot Check In', err?.message ?? 'Outside check-in window.');
      } else if (err?.status === 409) {
        Alert.alert('Already Active', 'An active session already exists for this booking.');
      } else {
        Alert.alert('Error', 'Check-in failed. Please try again.');
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setBookingRef('');
    setError('');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Check-In</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Step 1: Reference Input Card ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Text style={styles.cardIcon}>🔖</Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>Booking Reference</Text>
                  <Text style={styles.cardSubtitle}>Enter the drivers booking code</Text>
                </View>
              </View>

              <View style={styles.searchRow}>
                <View style={[styles.inputWrap, error ? styles.inputError : null]}>
                  <Text style={styles.inputIcon}>#</Text>
                  <TextInput
                    style={styles.input}
                    value={bookingRef}
                    onChangeText={t => { setBookingRef(t); setError(''); }}
                    placeholder="BK-XXXXXXXX"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={handleLookup}
                    editable={!preview} // lock field once booking found
                  />
                  {preview && (
                    <TouchableOpacity onPress={handleReset} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {!preview && (
                  <TouchableOpacity
                    style={[styles.lookupBtn, lookupLoading && { opacity: 0.7 }]}
                    onPress={handleLookup}
                    disabled={lookupLoading}
                    activeOpacity={0.85}
                  >
                    {lookupLoading
                      ? <ActivityIndicator color={colors.white} size="small" />
                      : <Text style={styles.lookupBtnText}>Look Up</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>

            {/* ── Step 2: Booking Preview Card (shown after lookup) ── */}
            {preview && (
              <Animated.View
                style={[
                  styles.card,
                  { marginTop: 12 },
                  {
                    opacity: cardAnim,
                    transform: [{
                      translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
                    }],
                  },
                ]}
              >
                {/* Found badge */}
                <View style={styles.foundBadge}>
                  <View style={styles.foundDot} />
                  <Text style={styles.foundBadgeText}>Booking Found</Text>
                </View>

                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconWrap, { backgroundColor: colors.greenLight }]}>
                    <Text style={styles.cardIcon}>🚗</Text>
                  </View>
                  <Text style={styles.cardTitle}>Driver & Slot Details</Text>
                </View>

                <InfoRow icon="👤" label="Driver" value={preview.driver_name} />
                <InfoRow icon="🅿️" label="Slot" value={`${preview.slot_number} (${preview.slot_type})`} />
                <InfoRow
                  icon="🕐"
                  label="Expected Arrival"
                  value={new Date(preview.expected_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <InfoRow
                  icon="🕔"
                  label="Expected Departure"
                  value={new Date(preview.expected_departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <InfoRow
                  icon="💵"
                  label="Deposit Paid"
                  value={`KES ${preview.advance_fee_paid}`}
                />
              </Animated.View>
            )}

            {/* ── Confirm Button (only when preview is loaded) ── */}
            {preview && (
              <Animated.View style={{ opacity: cardAnim }}>
                <TouchableOpacity
                  style={[styles.confirmBtn, confirmLoading && styles.confirmBtnDisabled]}
                  onPress={handleConfirmCheckIn}
                  disabled={confirmLoading}
                  activeOpacity={0.85}
                >
                  {confirmLoading
                    ? <ActivityIndicator color={colors.white} />
                    : (
                      <>
                        <Text style={styles.confirmIcon}>→|</Text>
                        <Text style={styles.confirmLabel}>Confirm Check-In</Text>
                      </>
                    )
                  }
                </TouchableOpacity>
              </Animated.View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },

  // Header
  headerSafe: { backgroundColor: colors.navy },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.navy,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: colors.white, fontWeight: '300', lineHeight: 30 },
  headerTitle: { fontSize: scale(17), fontWeight: '700', color: colors.white },

  // Scroll
  scroll: { padding: 16, paddingBottom: 48 },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 20, padding: 20,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 20,
  },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontSize: scale(16), fontWeight: '700', color: colors.textPrimary },
  cardSubtitle: { fontSize: scale(12), color: colors.textSecondary, marginTop: 2 },

  // Search row
  searchRow: { flexDirection: 'row', gap: 10 },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputError: { borderColor: colors.red },
  inputIcon: {
    fontSize: scale(18), fontWeight: '700',
    color: colors.textSecondary, marginRight: 10,
  },
  input: {
    flex: 1, fontSize: scale(15),
    color: colors.textPrimary, fontWeight: '600',
    letterSpacing: 1,
  },
  clearBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  lookupBtn: {
    paddingHorizontal: 18, height: 52,
    borderRadius: 14, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  lookupBtnText: { fontSize: scale(14), fontWeight: '700', color: colors.white },

  // Error box
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: 12,
    padding: 12, marginTop: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorIcon: { fontSize: 16 },
  errorText: { flex: 1, fontSize: scale(13), color: colors.red, fontWeight: '500' },

  // Found badge
  foundBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.greenLight,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: 'flex-start', marginBottom: 16,
  },
  foundDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  foundBadgeText: { fontSize: scale(12), fontWeight: '700', color: colors.green },

  // Confirm button
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    backgroundColor: colors.green, borderRadius: 16,
    height: 58, marginTop: 16,
    ...shadows.strong,
  },
  confirmBtnDisabled: { opacity: 0.65 },
  confirmIcon: { fontSize: 20, color: colors.white, fontWeight: '700' },
  confirmLabel: { fontSize: scale(16), fontWeight: '700', color: colors.white },
});