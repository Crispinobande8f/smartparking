/**
 * ActiveSessionsCheckOutScreen
 * File: app/(attendant)/active-checkout.tsx
 *
 * Shows all active sessions sorted: checkout-requested first, then others.
 * Tap any car → checkout summary modal with full bill breakdown.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
  RefreshControl,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  MOCK_ACTIVE_SESSIONS,
  ActiveSession,
  getElapsed,
  getTotalBill,
  getBalance,
  formatTime,
} from '@/constants/sessionData';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  navy: '#0F2D5E', green: '#00C48C', greenLight: '#E8FBF5',
  amber: '#F5A623', amberLight: '#FEF6E7',
  red: '#E84040', redLight: '#FDEAEA',
  white: '#FFFFFF', surface: '#F7F8FA', border: '#ECEEF2',
  textPrimary: '#1A1A2E', textSecondary: '#8A94A6', textMuted: '#B0B7C3',
};
const shadow = { shadowColor:'#0F2D5E', shadowOffset:{width:0,height:4}, shadowOpacity:0.08, shadowRadius:12, elevation:4 };
const shadowStrong = { shadowColor:'#0F2D5E', shadowOffset:{width:0,height:10}, shadowOpacity:0.18, shadowRadius:28, elevation:12 };

// ─── Checkout Summary Modal ───────────────────────────────────────────────────
function CheckoutModal({
  session,
  visible,
  onClose,
  onConfirm,
  loading,
}: {
  session: ActiveSession | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [liveElapsed, setLiveElapsed] = useState('');
  const [liveBill,    setLiveBill]    = useState(0);
  const [liveBalance, setLiveBalance] = useState(0);

  useEffect(() => {
    if (visible && session) {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, damping: 22, stiffness: 130,
      }).start();
      // Update live figures
      const update = () => {
        setLiveElapsed(getElapsed(session.checkedInAt));
        setLiveBill(getTotalBill(session.checkedInAt, session.ratePerHour));
        setLiveBalance(getBalance(session.checkedInAt, session.ratePerHour, session.depositPaid));
      };
      update();
      const interval = setInterval(update, 10000);
      return () => clearInterval(interval);
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible, session]);

  if (!session) return null;

  const totalBill    = liveBill    || getTotalBill(session.checkedInAt, session.ratePerHour);
  const balanceDue   = liveBalance >= 0 ? liveBalance : getBalance(session.checkedInAt, session.ratePerHour, session.depositPaid);
  const elapsed      = liveElapsed || getElapsed(session.checkedInAt);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[mStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Handle */}
            <View style={mStyles.handle} />

            {/* Title */}
            <Text style={mStyles.title}>Session Summary</Text>
            <Text style={mStyles.subtitle}>Review before confirming check-out</Text>

            {/* Vehicle + Driver Block */}
            <View style={mStyles.infoBlock}>
              <View style={mStyles.infoRow}>
                <View style={mStyles.infoIconBox}>
                  <Text style={{ fontSize:22 }}>🚗</Text>
                </View>
                <View style={mStyles.infoContent}>
                  <Text style={mStyles.infoLabel}>Vehicle</Text>
                  <Text style={mStyles.infoValue}>{session.plate}</Text>
                </View>
              </View>
              <View style={mStyles.infoDivider} />
              <View style={mStyles.infoRow}>
                <View style={[mStyles.infoIconBox, { backgroundColor:'#EEF1F6' }]}>
                  <Text style={{ fontSize:22 }}>👤</Text>
                </View>
                <View style={mStyles.infoContent}>
                  <Text style={mStyles.infoLabel}>Driver</Text>
                  <Text style={mStyles.infoValue}>{session.driverName}</Text>
                  <Text style={mStyles.infoSub}>{session.phone}</Text>
                </View>
              </View>
              <View style={mStyles.infoDivider} />
              <View style={mStyles.infoRow}>
                <View style={[mStyles.infoIconBox, { backgroundColor: C.greenLight }]}>
                  <Text style={{ fontSize:22 }}>🅿️</Text>
                </View>
                <View style={mStyles.infoContent}>
                  <Text style={mStyles.infoLabel}>Slot</Text>
                  <Text style={mStyles.infoValue}>Slot {session.slot} — {session.zone}</Text>
                  <Text style={mStyles.infoSub}>
                    Checked in: {formatTime(session.checkedInAt)}
                  </Text>
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
              <Text style={mStyles.timeBannerRate}>@ KES {session.ratePerHour}/hr</Text>
            </View>

            {/* Bill Breakdown */}
            <View style={mStyles.billCard}>
              <Text style={mStyles.billCardTitle}>💰 Bill Breakdown</Text>

              <View style={mStyles.billRow}>
                <Text style={mStyles.billRowLabel}>Total Parking Charge</Text>
                <Text style={mStyles.billRowValue}>KES {totalBill}</Text>
              </View>
              <View style={mStyles.billDivider} />

              <View style={mStyles.billRow}>
                <View>
                  <Text style={mStyles.billRowLabel}>Deposit Paid</Text>
                  <Text style={mStyles.billRowSub}>Paid at time of booking</Text>
                </View>
                <Text style={[mStyles.billRowValue, { color: C.green }]}>
                  − KES {session.depositPaid}
                </Text>
              </View>
              <View style={mStyles.billDivider} />

              <View style={[mStyles.billRow, mStyles.billTotalRow]}>
                <Text style={mStyles.billTotalLabel}>Balance Due</Text>
                <Text style={[mStyles.billTotalValue, { color: balanceDue > 0 ? C.red : C.green }]}>
                  KES {balanceDue}
                </Text>
              </View>

              {balanceDue === 0 && (
                <View style={mStyles.paidBadge}>
                  <Text style={mStyles.paidBadgeText}>✓ Fully Paid by Deposit</Text>
                </View>
              )}
            </View>

            {/* Summary totals row */}
            <View style={mStyles.summaryTotals}>
              <View style={mStyles.totalItem}>
                <Text style={mStyles.totalItemLabel}>Deposit</Text>
                <Text style={[mStyles.totalItemValue, { color: C.green }]}>
                  KES {session.depositPaid}
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
                <Text style={[mStyles.totalItemValue, { color: C.navy }]}>
                  KES {totalBill}
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

const mStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(10,10,15,0.6)', justifyContent:'flex-end' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius:32, borderTopRightRadius:32,
    paddingHorizontal:24, paddingBottom:48, maxHeight:'92%',
    ...shadowStrong,
  },
  handle: { width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:'center', marginTop:10, marginBottom:20 },
  title: { fontSize:22, fontWeight:'700', color:C.textPrimary },
  subtitle: { fontSize:13, color:C.textSecondary, marginTop:4, marginBottom:20 },

  // Info block
  infoBlock: { backgroundColor:C.surface, borderRadius:16, marginBottom:14 },
  infoRow: { flexDirection:'row', alignItems:'center', padding:14 },
  infoIconBox: { width:46, height:46, borderRadius:13, backgroundColor:C.amberLight, alignItems:'center', justifyContent:'center', marginRight:14 },
  infoContent: { flex:1 },
  infoLabel: { fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:0.5 },
  infoValue: { fontSize:15, fontWeight:'700', color:C.textPrimary, marginTop:2 },
  infoSub: { fontSize:12, color:C.textSecondary, marginTop:1 },
  infoDivider: { height:1, backgroundColor:C.border, marginHorizontal:14 },

  // Time banner
  timeBanner: {
    flexDirection:'row', alignItems:'center', gap:12,
    backgroundColor: C.navy, borderRadius:14, padding:16, marginBottom:14,
  },
  timeBannerIcon: { fontSize:24 },
  timeBannerLabel: { fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:2 },
  timeBannerValue: { fontSize:22, fontWeight:'800', color:C.white },
  timeBannerRate: { marginLeft:'auto', fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:'500' },

  // Bill card
  billCard: { backgroundColor:C.surface, borderRadius:16, padding:16, marginBottom:14 },
  billCardTitle: { fontSize:14, fontWeight:'700', color:C.textPrimary, marginBottom:14 },
  billRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10 },
  billRowLabel: { fontSize:14, color:C.textSecondary },
  billRowSub: { fontSize:11, color:C.textMuted, marginTop:2 },
  billRowValue: { fontSize:15, fontWeight:'700', color:C.textPrimary },
  billDivider: { height:1, backgroundColor:C.border },
  billTotalRow: { paddingTop:14 },
  billTotalLabel: { fontSize:15, fontWeight:'700', color:C.textPrimary },
  billTotalValue: { fontSize:22, fontWeight:'800' },
  paidBadge: { backgroundColor: C.greenLight, borderRadius:8, padding:10, marginTop:10, alignItems:'center' },
  paidBadgeText: { fontSize:13, color: C.green, fontWeight:'700' },

  // Summary totals
  summaryTotals: {
    flexDirection:'row', backgroundColor:C.navy, borderRadius:14,
    padding:16, marginBottom:20,
  },
  totalItem: { flex:1, alignItems:'center' },
  totalItemLabel: { fontSize:11, color:'rgba(255,255,255,0.55)', marginBottom:4 },
  totalItemValue: { fontSize:16, fontWeight:'800' },
  totalDivider: { width:1, backgroundColor:'rgba(255,255,255,0.15)' },

  // Buttons
  btnRow: { flexDirection:'row', gap:12 },
  cancelBtn: { flex:1, height:54, borderRadius:14, borderWidth:1.5, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  cancelText: { fontSize:15, fontWeight:'600', color:C.textSecondary },
  confirmBtn: { flex:2, height:54, borderRadius:14, backgroundColor:C.red, alignItems:'center', justifyContent:'center' },
  confirmText: { fontSize:15, fontWeight:'700', color:C.white },
});

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
  const [elapsed, setElapsed] = useState(getElapsed(session.checkedInAt));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:320, delay: index * 70, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:320, delay: index * 70, useNativeDriver:true }),
    ]).start();
    const interval = setInterval(() => setElapsed(getElapsed(session.checkedInAt)), 60000);
    return () => clearInterval(interval);
  }, []);

  const pressIn  = () => Animated.spring(scaleAnim, { toValue:0.97, useNativeDriver:true, speed:50 }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue:1.0,  useNativeDriver:true, speed:50 }).start();

  const isRequested = session.checkoutRequested;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform:[{ translateY: slideAnim },{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, isRequested && styles.cardRequested]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: isRequested ? C.red : C.green }]} />

        <View style={styles.cardBody}>
          {/* Top: icon + plate/name + checkout badge */}
          <View style={styles.topRow}>
            <View style={[styles.carIconBox, { backgroundColor: isRequested ? C.redLight : C.greenLight }]}>
              <Text style={{ fontSize:22 }}>🚗</Text>
            </View>
            <View style={styles.topInfo}>
              <Text style={styles.plateTxt}>{session.plate}</Text>
              <Text style={styles.driverTxt}>{session.driverName}</Text>
            </View>
            {isRequested && (
              <View style={styles.requestedBadge}>
                <Text style={styles.requestedDot}>●</Text>
                <Text style={styles.requestedTxt}>Checkout</Text>
              </View>
            )}
          </View>

          {/* Meta chips */}
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
                KES {getTotalBill(session.checkedInAt, session.ratePerHour)}
              </Text>
            </View>
          </View>

          {/* Bottom: check-in time + tap hint */}
          <View style={styles.bottomRow}>
            <Text style={styles.checkinTime}>
              In since {formatTime(session.checkedInAt)}
            </Text>
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
function SectionHeader({ title, count, urgent }: { title:string; count:number; urgent?:boolean }) {
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
  const [sessions, setSessions] = useState(MOCK_ACTIVE_SESSIONS);
  const [selected, setSelected] = useState<ActiveSession | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
  }, []);

  // Sort: checkout-requested first, then by elapsed time desc
  const sorted = [...sessions].sort((a, b) => {
    if (a.checkoutRequested && !b.checkoutRequested) return -1;
    if (!a.checkoutRequested && b.checkoutRequested) return 1;
    return new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime();
  });

  const requestedSessions = sorted.filter(s => s.checkoutRequested);
  const activeSessions    = sorted.filter(s => !s.checkoutRequested);

  const handleCardPress = (session: ActiveSession) => {
    setSelected(session);
    setModalVisible(true);
  };

  const handleConfirmCheckout = () => {
    if (!selected) return;
    setLoading(true);
    // TODO: POST /api/v1/sessions/:id/checkout
    setTimeout(() => {
      setLoading(false);
      setModalVisible(false);
      setSessions(prev => prev.filter(s => s.id !== selected.id));
      const total = getTotalBill(selected.checkedInAt, selected.ratePerHour);
      const balance = getBalance(selected.checkedInAt, selected.ratePerHour, selected.depositPaid);
      Alert.alert(
        'Checked Out ✅',
        `${selected.plate} — Slot ${selected.slot}\n` +
        `Time: ${getElapsed(selected.checkedInAt)}\n` +
        `Total: KES ${total} | Balance: KES ${balance}`,
        [{ text: 'Done' }]
      );
      setSelected(null);
    }, 1600);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Header */}
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

          {/* Stats strip */}
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

      {/* Sessions list with section headers */}
      <FlatList
        data={[
          ...(requestedSessions.length > 0 ? [{ type:'header', id:'h1', title:`Requesting Checkout`, count: requestedSessions.length, urgent: true }] : []),
          ...requestedSessions.map(s => ({ type:'session', ...s })),
          ...(activeSessions.length > 0   ? [{ type:'header', id:'h2', title:'Still Parked', count: activeSessions.length, urgent: false }] : []),
          ...activeSessions.map(s => ({ type:'session', ...s })),
        ]}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(()=>setRefreshing(false),1000); }} tintColor={C.green} />
        }
        renderItem={({ item, index }: { item: any; index: number }) => {
          if (item.type === 'header') {
            return <SectionHeader title={item.title} count={item.count} urgent={item.urgent} />;
          }
          const session = item as ActiveSession;
          const sessionIndex = sorted.findIndex(s => s.id === session.id);
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

      {/* Checkout modal */}
      <CheckoutModal
        session={selected}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setSelected(null); }}
        onConfirm={handleConfirmCheckout}
        loading={loading}
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

  // Empty
  empty: { alignItems:'center', paddingVertical:80 },
  emptyIcon: { fontSize:56, marginBottom:16 },
  emptyTitle: { fontSize:18, fontWeight:'700', color:C.textPrimary, marginBottom:6 },
  emptySub: { fontSize:14, color:C.textSecondary },
});