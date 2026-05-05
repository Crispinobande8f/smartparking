/**
 * CheckOutScreen.tsx
 * Screen: Attendant vehicle check-out — search plate, show session info, bill, confirm
 * Route: app/(attendant)/checkout.tsx
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  searchSessionByRef,
  fetchCheckoutPreview,
  confirmCheckoutSession,
  ActiveSession,
  CheckoutPreview,
} from '@/services/sessions';
import { getElapsed, getAmount } from '@/constants/mockData';
import { colors, shadows, scale } from '@/constants/theme';

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CheckOutScreen() {
  const [query, setQuery] = useState('');
  const [foundSession, setFoundSession] = useState<ActiveSession | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);

  // Live bill update
  const [elapsed, setElapsed] = useState('');
  const [amount, setAmount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);


  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    setFoundSession(null);
    setPreview(null);

    try {
      const session = await searchSessionByRef(query);
      if (session) {
        setFoundSession(session);
        const bill = await fetchCheckoutPreview(session.session_id); // use session_id not id
        setPreview(bill);
      } else {
        setNotFound(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!foundSession) return;
    setConfirming(true);

    try {
      const result = await confirmCheckoutSession(foundSession.session_id);

      // Handle M-Pesa STK push path — balance is owed
      if (result.checkout_request_id) {
        Alert.alert(
          'Payment Required 📱',
          `An M-Pesa prompt has been sent to the driver.\nBalance due: KES ${preview?.balance_due}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Zero-balance path — fully complete
      Alert.alert(
        'Check-Out Successful ✅',
        `${foundSession.plate} checked out.\nTotal: KES ${preview?.total_fee ?? 0}`,
        [{
          text: 'Done',
          onPress: () => {
            setFoundSession(null);
            setPreview(null);
            setQuery('');
            router.back();
          },
        }]
      );
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message ?? 'Something went wrong.');
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (foundSession) {
      cardAnim.setValue(0);
      Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 120 }).start();
      setElapsed(getElapsed(foundSession.checkin_time));
      setAmount(getAmount(foundSession.checkin_time, foundSession.hourly_rate));

      const interval = setInterval(() => {
        setElapsed(getElapsed(foundSession.checkin_time));
        setAmount(getAmount(foundSession.checkin_time, foundSession.hourly_rate));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [foundSession]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Navy Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Check-Out</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Search Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Find Vehicle</Text>

            <View style={styles.searchRow}>
              <View style={styles.searchInputWrap}>
                <Text style={styles.searchPrefixIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="BK-XXXXXXXX"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={handleSearch}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.searchBtnIcon}>🔍</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick tap active sessions 
            <Text style={styles.quickLabel}>Or tap an active session:</Text>
            <View style={styles.quickRow}>
              {MOCK_ACTIVE_SESSIONS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.quickChip}
                  onPress={() => {
                    setQuery(s.plate);
                    setFoundSession(s);
                    setNotFound(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickChipText}>{s.plate}</Text>
                </TouchableOpacity>
              ))}
            </View> */}
          </View>

          {/* Not found state */}
          {notFound && (
            <View style={styles.notFoundCard}>
              <Text style={styles.notFoundIcon}>❌</Text>
              <Text style={styles.notFoundText}>{`No active session found for "${query}"`}</Text>
            </View>
          )} 

          {/* Found Session Card */}
          {foundSession && (
            <Animated.View
              style={[
                styles.card,
                { marginTop: 12 },
                {
                  opacity: cardAnim,
                  transform: [
                    {
                      translateY: cardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Session summary */}
              <View style={styles.sessionSummaryRow}>
                <View style={styles.sessionIconWrap}>
                  <Text style={styles.sessionIcon}>🚗</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionPlate}>{foundSession.plate}</Text>
                  <Text style={styles.sessionDriver}>{foundSession.driver_name}</Text>
                </View>
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              </View>

              {/* Slot + duration chips */}
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaIcon}>🅿️</Text>
                  <Text style={styles.metaText}>Slot {foundSession.slot}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaIcon}>🕐</Text>
                  <Text style={styles.metaText}>{elapsed}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Bill card */}
          {foundSession && (
            <Animated.View
              style={[
                styles.billCard,
                {
                  opacity: cardAnim,
                  transform: [
                    {
                      translateY: cardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.billLabel}>Total Bill</Text>
              <Text style={styles.billAmount}>KES {preview?.total_fee ?? amount}</Text>
              <Text style={styles.billBreakdown}>
                {elapsed} × KES {foundSession.hourly_rate}/hr
              </Text>
            </Animated.View>
          )}

          {preview?.is_overtime && (
              <Text style={[styles.billBreakdown, { color: '#E53935', marginTop: 4 }]}>
                ⚠️ Overtime — late fee: KES {preview.late_fee}
              </Text>
            )}
          {/* Confirm Check-Out button */}
          {foundSession && (
            <Animated.View style={{ opacity: cardAnim }}>
              <TouchableOpacity
                style={[styles.checkoutBtn, confirming && styles.checkoutBtnDisabled]}
                onPress={handleConfirmCheckout}
                disabled={confirming}
                activeOpacity={0.85}
              >
                {confirming ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.checkoutIcon}>|→</Text>
                    <Text style={styles.checkoutLabel}>Confirm Check-Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },

  // Header
  headerSafe: { backgroundColor: colors.navy },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.navy,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: colors.white, fontWeight: '300', lineHeight: 30 },
  headerTitle: {
    fontSize: scale(17),
    fontWeight: '700',
    color: colors.white,
  },

  scroll: { padding: 16, paddingBottom: 48 },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },

  // Search
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPrefixIcon: { fontSize: 16, marginRight: 8, color: colors.textMuted },
  searchInput: {
    flex: 1,
    fontSize: scale(15),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  searchBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  searchBtnIcon: { fontSize: 20 },

  // Quick chips
  quickLabel: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginBottom: 10,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: {
    fontSize: scale(13),
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Not found
  notFoundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  notFoundIcon: { fontSize: 18 },
  notFoundText: {
    fontSize: scale(13),
    color: colors.red,
    fontWeight: '500',
    flex: 1,
  },

  // Session summary
  sessionSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionIcon: { fontSize: 20 },
  sessionInfo: { flex: 1 },
  sessionPlate: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sessionDriver: {
    fontSize: scale(13),
    color: colors.textSecondary,
    marginTop: 3,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  activePillText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: colors.green,
  },

  // Meta chips
  metaRow: { flexDirection: 'row', gap: 10 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  metaIcon: { fontSize: 14 },
  metaText: {
    fontSize: scale(13),
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Bill
  billCard: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: 24,
    marginTop: 12,
    alignItems: 'flex-start',
    ...shadows.strong,
  },
  billLabel: {
    fontSize: scale(13),
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginBottom: 6,
  },
  billAmount: {
    fontSize: scale(40),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1,
  },
  billBreakdown: {
    fontSize: scale(13),
    color: colors.green,
    fontWeight: '500',
    marginTop: 6,
  },

  // Checkout button
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.red,
    borderRadius: 16,
    height: 58,
    marginTop: 16,
    ...shadows.strong,
  },
  checkoutBtnDisabled: { opacity: 0.65 },
  checkoutIcon: { fontSize: 20, color: colors.white, fontWeight: '700' },
  checkoutLabel: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.white,
  },
});