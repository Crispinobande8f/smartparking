/**
 * ActiveSessionsCheckOutScreen
 * File: app/(attendant)/active-checkout.tsx
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
  Animated, StatusBar, RefreshControl, Modal, ActivityIndicator,
  ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  fetchActiveSessions,
  fetchCheckoutPreview,
  confirmCheckoutSession,
  ActiveSession,
  CheckoutPreview,
} from '@/services/sessions';
import { getElapsed, formatTime } from '@/constants/mockData';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  navy: '#0F2D5E', green: '#00C48C', greenLight: '#E8FBF5',
  amber: '#F5A623', amberLight: '#FEF6E7',
  red: '#E84040', redLight: '#FDEAEA',
  white: '#FFFFFF', surface: '#F7F8FA', border: '#ECEEF2',
  textPrimary: '#1A1A2E', textSecondary: '#8A94A6', textMuted: '#B0B7C3',
};
const shadow = { shadowColor: '#0F2D5E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 };
const shadowStrong = { shadowColor: '#0F2D5E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 12 };

// ─── Checkout Summary Modal ───────────────────────────────────────────────────
function CheckoutModal({
  session,
  preview,
  visible,
  onClose,
  onConfirm,
  loading,
}: {
  session: ActiveSession | null;
  preview: CheckoutPreview | null;         // ← server preview, not local calc
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (visible && session) {
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, damping: 22, stiffness: 130,
      }).start();

      const update = () => setElapsed(getElapsed(session.checkin_time));
      update();
      const interval = setInterval(update, 10000);
      return () => clearInterval(interval);
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible, session]);

  if (!session || !preview) return null;

  const balanceDue = preview.balance_due;
  const totalFee   = preview.total_fee;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[mStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={mStyles.handle} />
            <Text style={mStyles.title}>Session Summary</Text>
            <Text style={mStyles.subtitle}>Review before confirming check-out</Text>

            {/* Vehicle + Driver Block */}
            <View style={mStyles.infoBlock}>
              <View style={mStyles.infoRow}>
                <View style={mStyles.infoIconBox}>
                  <Text style={{ fontSize: 22 }}>🚗</Text>
                </View>
                <View style={mStyles.infoContent}>
                  <Text style={mStyles.infoLabel}>Vehicle</Text>
                  <Text style={mStyles.infoValue}>{session.plate}</Text>
                </View>
              </View>
              <View style={mStyles.infoDivider} />
              <View style={mStyles.infoRow}>
                <View style={[mStyles.infoIconBox, { backgroundColor: '#EEF1F6' }]}>
                  <Text style={{ fontSize: 22 }}>👤</Text>
                </View>
                <View style={mStyles.infoContent}>
                  <Text style={mStyles.infoLabel}>Driver</Text>
                  <Text style={mStyles.infoValue}>{session.driver_name}</Text>
                </View>
              </View>
              <View style={mStyles.infoDivider} />
              <View style={mStyles.infoRow}>
                <View style={[mStyles.infoIconBox, { backgroundColor: C.greenLight }]}>
                  <Text style={{ fontSize: 22 }}>🅿️</Text>
                </View>
                <View style={mStyles.infoContent}>
                  <Text style={mStyles.infoLabel}>Slot</Text>
                  <Text style={mStyles.infoValue}>Slot {session.slot} — Zone {session.zone}</Text>
                  <Text style={mStyles.infoSub}>Checked in: {formatTime(session.checkin_time)}</Text>
                </View>
              </View>
            </View>

            {/* Time Parked Banner */}
            <View style={mStyles.timeBanner}>
              <Text style={mStyles.timeBannerIcon}>🕐</Text>
              <View>
                <Text style={mStyles.timeBannerLabel}>Time Parked</Text>
                <Text style={mStyles.timeBannerValue}>{elapsed}</Text>
              </View>
              <Text style={mStyles.timeBannerRate}>@ KES {session.hourly_rate}/hr</Text>
            </View>

            {/* Bill Breakdown — all figures from server preview */}
            <View style={mStyles.billCard}>
              <Text style={mStyles.billCardTitle}>💰 Bill Breakdown</Text>

              <View style={mStyles.billRow}>
                <Text style={mStyles.billRowLabel}>Base Fee</Text>
                <Text style={mStyles.billRowValue}>KES {preview.base_fee}</Text>
              </View>

              {preview.is_overtime && (
                <>
                  <View style={mStyles.billDivider} />
                  <View style={mStyles.billRow}>
                    <View>
                      <Text style={[mStyles.billRowLabel, { color: C.red }]}>⚠️ Overtime Fee</Text>
                    </View>
                    <Text style={[mStyles.billRowValue, { color: C.red }]}>
                      + KES {preview.late_fee}
                    </Text>
                  </View>
                </>
              )}

              <View style={mStyles.billDivider} />
              <View style={mStyles.billRow}>
                <Text style={mStyles.billRowLabel}>Total Parking Charge</Text>
                <Text style={mStyles.billRowValue}>KES {totalFee}</Text>
              </View>
              <View style={mStyles.billDivider} />

              <View style={mStyles.billRow}>
                <View>
                  <Text style={mStyles.billRowLabel}>Advance Paid</Text>
                  <Text style={mStyles.billRowSub}>Paid at time of booking</Text>
                </View>
                <Text style={[mStyles.billRowValue, { color: C.green }]}>
                  − KES {preview.advance_paid}
                </Text>
              </View>
              <View style={mStyles.billDivider} />

              <View style={[mStyles.billRow, mStyles.billTotalRow]}>
                <Text style={mStyles.billTotalLabel}>Balance Due</Text>
                <Text style={[mStyles.billTotalValue, { color: balanceDue > 0 ? C.red : C.green }]}>
                  KES {balanceDue}
                </Text>
              </View>

              {balanceDue <= 0 && (
                <View style={mStyles.paidBadge}>
                  <Text style={mStyles.paidBadgeText}>✓ Fully Paid by Advance</Text>
                </View>
              )}

              {balanceDue > 0 && (
                <View style={[mStyles.paidBadge, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={[mStyles.paidBadgeText, { color: C.red }]}>
                    📱 M-Pesa prompt will be sent to driver
                  </Text>
                </View>
              )}
            </View>

            {/* Summary totals */}
            <View style={mStyles.summaryTotals}>
              <View style={mStyles.totalItem}>
                <Text style={mStyles.totalItemLabel}>Advance</Text>
                <Text style={[mStyles.totalItemValue, { color: C.green }]}>
                  KES {preview.advance_paid}
                </Text>
              </View>
              <View style={mStyles.totalDivider} />
              <View style={mStyles.totalItem}>
                <Text style={mStyles.totalItemLabel}>Balance</Text>
                <Text style={[mStyles.totalItemValue, { color: C.red }]}>
                  KES {balanceDue}
                </Text>
              </View>
              <View style={mStyles.totalDivider} />
              <View style={mStyles.totalItem}>
                <Text style={mStyles.totalItemLabel}>Total</Text>
                <Text style={[mStyles.totalItemValue, { color: C.white }]}>
                  KES {totalFee}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={mStyles.btnRow}>
              <TouchableOpacity style={mStyles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={mStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mStyles.confirmBtn, loading && { opacity: 0.7 }]}
                onPress={onConfirm}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={C.white} />
                  : <Text style={mStyles.confirmText}>|→  Confirm Check-Out</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({
  session,
  index,
  onPress,
}: {
  session: ActiveSession;
  index: number;
  onPress: () => void;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [elapsed, setElapsed] = useState(getElapsed(session.checkin_time));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, delay: index * 70, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay: index * 70, useNativeDriver: true }),
    ]).start();
    const interval = setInterval(() => setElapsed(getElapsed(session.checkin_time)), 60000);
    return () => clearInterval(interval);
  }, []);

  const pressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1.0,  useNativeDriver: true, speed: 50 }).start();

  const isRequested = session.checkout_requested;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, isRequested && styles.cardRequested]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        <View style={[styles.accentBar, { backgroundColor: isRequested ? C.red : C.green }]} />
        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <View style={[styles.carIconBox, { backgroundColor: isRequested ? C.redLight : C.greenLight }]}>
              <Text style={{ fontSize: 22 }}>🚗</Text>
            </View>
            <View style={styles.topInfo}>
              <Text style={styles.plateTxt}>{session.plate}</Text>
              <Text style={styles.driverTxt}>{session.driver_name}</Text>
            </View>
            {isRequested && (
              <View style={styles.requestedBadge}>
                <Text style={styles.requestedDot}>●</Text>
                <Text style={styles.requestedTxt}>Checkout</Text>
              </View>
            )}
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>🅿️</Text>
              <Text style={styles.chipTxt}>Slot {session.slot}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>🕐</Text>
              <Text style={styles.chipTxt}>{elapsed}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>💵</Text>
              <Text style={[styles.chipTxt, { color: C.green }]}>
                KES {session.advance_paid}↑
              </Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.checkinTime}>In since {formatTime(session.checkin_time)}</Text>
            {isRequested
              ? <Text style={styles.tapHintRed}>Tap to check out →</Text>
              : <Text style={styles.tapHint}>Tap to view →</Text>}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, count, urgent }: { title: string; count: number; urgent?: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      {urgent && <View style={styles.urgentDot} />}
      <Text style={[styles.sectionTitle, urgent && { color: C.red }]}>{title}</Text>
      <View style={[styles.sectionCount, urgent && { backgroundColor: C.redLight }]}>
        <Text style={[styles.sectionCountTxt, urgent && { color: C.red }]}>{count}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ActiveCheckOutScreen() {
  const [sessions, setSessions]       = useState<ActiveSession[]>([]);
  const [selected, setSelected]       = useState<ActiveSession | null>(null);
  const [preview, setPreview]         = useState<CheckoutPreview | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirming, setConfirming]   = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchActiveSessions();
      setSessions(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not load sessions.');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const sorted = [...sessions].sort((a, b) => {
    if (a.checkout_requested && !b.checkout_requested) return -1;
    if (!a.checkout_requested && b.checkout_requested) return 1;
    return new Date(a.checkin_time).getTime() - new Date(b.checkin_time).getTime();
  });

  const requestedSessions = sorted.filter(s => s.checkout_requested);
  const activeSessions    = sorted.filter(s => !s.checkout_requested);

  const handleCardPress = async (session: ActiveSession) => {
    setSelected(session);
    setPreview(null);
    setModalVisible(true);
    setLoadingPreview(true);

    try {
      const bill = await fetchCheckoutPreview(session.session_id);
      setPreview(bill);
    } catch (e: any) {
      Alert.alert('Error', 'Could not load billing preview.');
      setModalVisible(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!selected || !preview) return;
    setConfirming(true);

    try {
      const result = await confirmCheckoutSession(selected.session_id);

      setModalVisible(false);
      setSelected(null);
      setPreview(null);

      // STK push path — balance owed, M-Pesa prompt sent to driver
      if (result.checkout_request_id) {
        Alert.alert(
          'Payment Required 📱',
          `M-Pesa prompt sent to driver.\nBalance due: KES ${preview.balance_due}`,
          [{
            text: 'OK',
            onPress: () => {
              // Remove from list — session is now awaiting_payment, not active
              setSessions(prev => prev.filter(s => s.session_id !== selected.session_id));
            },
          }]
        );
        return;
      }

      // Zero-balance path — fully complete
      setSessions(prev => prev.filter(s => s.session_id !== selected.session_id));
      Alert.alert(
        'Checked Out ✅',
        `${selected.plate} — Slot ${selected.slot}\nTotal: KES ${preview.total_fee}`,
        [{ text: 'Done' }]
      );
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message ?? 'Something went wrong.');
    } finally {
      setConfirming(false);
    }
  };

  const listData = [
    ...(requestedSessions.length > 0
      ? [{ type: 'header', id: 'h1', title: 'Requesting Checkout', count: requestedSessions.length, urgent: true }]
      : []),
    ...requestedSessions.map(s => ({ type: 'session', ...s })),
    ...(activeSessions.length > 0
      ? [{ type: 'header', id: 'h2', title: 'Still Parked', count: activeSessions.length, urgent: false }]
      : []),
    ...activeSessions.map(s => ({ type: 'session', ...s })),
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Active Sessions</Text>
              <Text style={styles.headerSub}>
                {requestedSessions.length > 0
                  ? `${requestedSessions.length} requesting checkout`
                  : 'Tap any car to check out'}
              </Text>
            </View>
            <View style={[styles.countBadge, requestedSessions.length > 0 && styles.countBadgeRed]}>
              <Text style={styles.countTxt}>{sessions.length}</Text>
            </View>
          </View>

          <View style={styles.statsStrip}>
            <View style={styles.stripItem}>
              <Text style={styles.stripNum}>{sessions.length}</Text>
              <Text style={styles.stripLbl}>Total Active</Text>
            </View>
            <View style={styles.stripDiv} />
            <View style={styles.stripItem}>
              <Text style={[styles.stripNum, { color: C.red }]}>{requestedSessions.length}</Text>
              <Text style={styles.stripLbl}>Want Out</Text>
            </View>
            <View style={styles.stripDiv} />
            <View style={styles.stripItem}>
              <Text style={[styles.stripNum, { color: C.green }]}>{activeSessions.length}</Text>
              <Text style={styles.stripLbl}>Still Parked</Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {initialLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item: any) => item.id ?? item.session_id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.green} />
          }
          renderItem={({ item, index }: { item: any; index: number }) => {
            if (item.type === 'header') {
              return <SectionHeader title={item.title} count={item.count} urgent={item.urgent} />;
            }
            const session = item as ActiveSession;
            const sessionIndex = sorted.findIndex(s => s.session_id === session.session_id);
            return (
              <SessionCard
                session={session}
                index={sessionIndex}
                onPress={() => handleCardPress(session)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏁</Text>
              <Text style={styles.emptyTitle}>No Active Sessions</Text>
              <Text style={styles.emptySub}>All vehicles have been checked out</Text>
            </View>
          }
        />
      )}

      {/* Loading preview spinner shown inside modal area */}
      <CheckoutModal
        session={selected}
        preview={loadingPreview ? null : preview}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setSelected(null); setPreview(null); }}
        onConfirm={handleConfirmCheckout}
        loading={confirming || loadingPreview}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex:1, backgroundColor: C.surface },

  // Header
  header: { backgroundColor: C.navy, paddingBottom:16 },
  headerRow: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingTop:8, paddingBottom:12 },
  backBtn: { width:40, height:40, borderRadius:12, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  backIcon: { fontSize:26, color:C.white, fontWeight:'300', lineHeight:30 },
  headerCenter: { flex:1, alignItems:'center' },
  headerTitle: { fontSize:17, fontWeight:'700', color:C.white },
  headerSub: { fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 },
  countBadge: { width:40, height:40, borderRadius:20, backgroundColor: C.green, alignItems:'center', justifyContent:'center' },
  countBadgeRed: { backgroundColor: C.red },
  countTxt: { fontSize:16, fontWeight:'700', color:C.white },

  // Stats strip
  statsStrip: { flexDirection:'row', marginHorizontal:16, backgroundColor:'rgba(255,255,255,0.12)', borderRadius:14, padding:12 },
  stripItem: { flex:1, alignItems:'center' },
  stripNum: { fontSize:20, fontWeight:'700', color:C.white },
  stripLbl: { fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 },
  stripDiv: { width:1, backgroundColor:'rgba(255,255,255,0.2)' },

  // List
  list: { padding:16, paddingBottom:48 },

  // Section header
  sectionHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10, marginTop:4 },
  urgentDot: { width:8, height:8, borderRadius:4, backgroundColor: C.red },
  sectionTitle: { fontSize:14, fontWeight:'700', color:C.textPrimary, flex:1 },
  sectionCount: { paddingHorizontal:10, paddingVertical:3, borderRadius:20, backgroundColor: C.surface },
  sectionCountTxt: { fontSize:12, fontWeight:'700', color:C.textSecondary },

  // Card
  card: { backgroundColor:C.white, borderRadius:18, marginBottom:10, flexDirection:'row', overflow:'hidden', ...shadow },
  cardRequested: { borderWidth:1, borderColor: C.red + '50' },
  accentBar: { width:5 },
  cardBody: { flex:1, padding:14 },
  topRow: { flexDirection:'row', alignItems:'center', marginBottom:10 },
  carIconBox: { width:46, height:46, borderRadius:14, alignItems:'center', justifyContent:'center', marginRight:12 },
  topInfo: { flex:1 },
  plateTxt: { fontSize:16, fontWeight:'700', color:C.textPrimary },
  driverTxt: { fontSize:13, color:C.textSecondary, marginTop:2 },
  requestedBadge: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor: C.redLight, paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  requestedDot: { fontSize:8, color:C.red },
  requestedTxt: { fontSize:11, fontWeight:'700', color:C.red },

  // Chips
  chipsRow: { flexDirection:'row', flexWrap:'wrap', gap:7, marginBottom:12 },
  chip: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:C.surface, paddingHorizontal:9, paddingVertical:5, borderRadius:8 },
  chipIcon: { fontSize:12 },
  chipTxt: { fontSize:12, color:C.textSecondary, fontWeight:'500' },

  // Bottom row
  bottomRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  checkinTime: { fontSize:11, color:C.textMuted },
  tapHint: { fontSize:12, fontWeight:'600', color:C.green },
  tapHintRed: { fontSize:12, fontWeight:'600', color:C.red },

  // Loading wrapper for initial load spinner
  loadingWrap: { flex:1, alignItems:'center', justifyContent:'center', paddingTop:28 },

  // Empty
  empty: { alignItems:'center', paddingVertical:80 },
  emptyIcon: { fontSize:56, marginBottom:16 },
  emptyTitle: { fontSize:18, fontWeight:'700', color:C.textPrimary, marginBottom:6 },
  emptySub: { fontSize:14, color:C.textSecondary },
});