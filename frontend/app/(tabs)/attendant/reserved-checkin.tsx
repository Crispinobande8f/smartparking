/**
 * ReservedCheckInScreen
 * File: app/(attendant)/reserved-checkin.tsx
 *
 * Shows all pending reservations. Attendant taps a card to check the driver in.
 * Sorted by expected arrival time (soonest first).
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  MOCK_RESERVATIONS,
  Reservation,
  formatTime,
  minutesUntilArrival,
} from '@/constants/sessionData';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  navy: '#0F2D5E', green: '#00C48C', greenLight: '#E8FBF5',
  amber: '#F5A623', amberLight: '#FEF6E7', red: '#E84040', redLight: '#FDEAEA',
  white: '#FFFFFF', surface: '#F7F8FA', border: '#ECEEF2',
  textPrimary: '#1A1A2E', textSecondary: '#8A94A6', textMuted: '#B0B7C3',
};
const shadow = { shadowColor:'#0F2D5E', shadowOffset:{width:0,height:4}, shadowOpacity:0.08, shadowRadius:12, elevation:4 };
const shadowStrong = { shadowColor:'#0F2D5E', shadowOffset:{width:0,height:10}, shadowOpacity:0.15, shadowRadius:24, elevation:10 };

// ─── Arrival Badge ─────────────────────────────────────────────────────────────
function ArrivalBadge({ expectedArrival }: { expectedArrival: string }) {
  const mins = minutesUntilArrival(expectedArrival);
  let bg: string, text: string, label: string;
  if (mins < 0) {
    bg = C.redLight; text = C.red;
    label = `${Math.abs(mins)}m late`;
  } else if (mins <= 10) {
    bg = C.amberLight; text = C.amber;
    label = `in ${mins}m`;
  } else {
    bg = C.greenLight; text = C.green;
    label = `in ${mins}m`;
  }
  return (
    <View style={[arrBadge.pill, { backgroundColor: bg }]}>
      <Text style={[arrBadge.text, { color: text }]}>{label}</Text>
    </View>
  );
}
const arrBadge = StyleSheet.create({
  pill: { paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  text: { fontSize:12, fontWeight:'700' },
});

// ─── Confirm Check-In Modal ───────────────────────────────────────────────────
function ConfirmModal({
  reservation,
  visible,
  onClose,
  onConfirm,
  loading,
}: {
  reservation: Reservation | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, damping: 20, stiffness: 120,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!reservation) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[modal.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={modal.handle} />

          <Text style={modal.title}>Confirm Check-In</Text>
          <Text style={modal.subtitle}>Review reservation details before checking in</Text>

          {/* Details card */}
          <View style={modal.detailCard}>
            {/* Vehicle */}
            <View style={modal.detailRow}>
              <View style={modal.detailIconBox}>
                <Text style={{ fontSize: 20 }}>🚗</Text>
              </View>
              <View style={modal.detailInfo}>
                <Text style={modal.detailLabel}>Vehicle</Text>
                <Text style={modal.detailValue}>{reservation.plate}</Text>
              </View>
            </View>
            <View style={modal.divider} />

            {/* Driver */}
            <View style={modal.detailRow}>
              <View style={[modal.detailIconBox, { backgroundColor: '#EEF1F6' }]}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <View style={modal.detailInfo}>
                <Text style={modal.detailLabel}>Driver</Text>
                <Text style={modal.detailValue}>{reservation.driverName}</Text>
                <Text style={modal.detailSub}>{reservation.phone}</Text>
              </View>
            </View>
            <View style={modal.divider} />

            {/* Slot */}
            <View style={modal.detailRow}>
              <View style={[modal.detailIconBox, { backgroundColor: C.greenLight }]}>
                <Text style={{ fontSize: 20 }}>🅿️</Text>
              </View>
              <View style={modal.detailInfo}>
                <Text style={modal.detailLabel}>Slot</Text>
                <Text style={modal.detailValue}>Slot {reservation.slot} — {reservation.zone}</Text>
              </View>
            </View>
            <View style={modal.divider} />

            {/* Deposit */}
            <View style={modal.detailRow}>
              <View style={[modal.detailIconBox, { backgroundColor: C.amberLight }]}>
                <Text style={{ fontSize: 20 }}>💵</Text>
              </View>
              <View style={modal.detailInfo}>
                <Text style={modal.detailLabel}>Deposit Paid</Text>
                <Text style={[modal.detailValue, { color: C.green }]}>
                  KES {reservation.depositPaid}
                </Text>
              </View>
            </View>
          </View>

          {/* Booked at */}
          <Text style={modal.bookedAt}>
            Booked at {formatTime(reservation.bookedAt)} · KES {reservation.ratePerHour}/hr
          </Text>

          {/* Buttons */}
          <View style={modal.btnRow}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.confirmBtn, loading && { opacity: 0.7 }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={C.white} />
                : <Text style={modal.confirmText}>✓  Check In Now</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(10,10,15,0.55)', justifyContent:'flex-end' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8,
    ...shadowStrong,
  },
  handle: { width:40, height:4, backgroundColor: C.border, borderRadius:2, alignSelf:'center', marginBottom:20 },
  title: { fontSize:20, fontWeight:'700', color: C.textPrimary, marginBottom:4 },
  subtitle: { fontSize:13, color: C.textSecondary, marginBottom:20 },
  detailCard: { backgroundColor: C.surface, borderRadius:16, padding:4, marginBottom:16 },
  detailRow: { flexDirection:'row', alignItems:'center', padding:12 },
  detailIconBox: { width:44, height:44, borderRadius:12, backgroundColor: C.amberLight, alignItems:'center', justifyContent:'center', marginRight:14 },
  detailInfo: { flex:1 },
  detailLabel: { fontSize:11, color: C.textSecondary, fontWeight:'500', letterSpacing:0.4, textTransform:'uppercase' },
  detailValue: { fontSize:15, fontWeight:'700', color: C.textPrimary, marginTop:2 },
  detailSub: { fontSize:12, color: C.textSecondary, marginTop:1 },
  divider: { height:1, backgroundColor: C.border, marginHorizontal:12 },
  bookedAt: { fontSize:12, color: C.textMuted, textAlign:'center', marginBottom:20 },
  btnRow: { flexDirection:'row', gap:12 },
  cancelBtn: { flex:1, height:52, borderRadius:14, borderWidth:1.5, borderColor: C.border, alignItems:'center', justifyContent:'center' },
  cancelText: { fontSize:15, fontWeight:'600', color: C.textSecondary },
  confirmBtn: { flex:2, height:52, borderRadius:14, backgroundColor: C.green, alignItems:'center', justifyContent:'center' },
  confirmText: { fontSize:15, fontWeight:'700', color: C.white },
});

// ─── Reservation Card ─────────────────────────────────────────────────────────
function ReservationCard({
  item,
  index,
  onPress,
}: {
  item: Reservation;
  index: number;
  onPress: () => void;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:350, delay: index * 80, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:350, delay: index * 80, useNativeDriver:true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(scaleAnim, { toValue:0.97, useNativeDriver:true, speed:50 }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue:1.0,  useNativeDriver:true, speed:50 }).start();
  const mins = minutesUntilArrival(item.expectedArrival);
  const isLate = mins < 0;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform:[{ translateY: slideAnim },{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, isLate && styles.cardLate]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        {/* Left accent */}
        <View style={[styles.accent, { backgroundColor: isLate ? C.red : C.green }]} />

        <View style={styles.cardInner}>
          {/* Top row */}
          <View style={styles.topRow}>
            <View style={styles.vehicleIconBox}>
              <Text style={{ fontSize: 22 }}>🚗</Text>
            </View>
            <View style={styles.topInfo}>
              <Text style={styles.plateTxt}>{item.plate}</Text>
              <Text style={styles.driverTxt}>{item.driverName}</Text>
            </View>
            <ArrivalBadge expectedArrival={item.expectedArrival} />
          </View>

          {/* Meta chips row */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>🅿️</Text>
              <Text style={styles.chipTxt}>Slot {item.slot} — {item.zone}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>📱</Text>
              <Text style={styles.chipTxt}>{item.phone}</Text>
            </View>
          </View>

          {/* Bottom row: deposit + booked time + check-in button */}
          <View style={styles.bottomRow}>
            <View style={styles.depositBox}>
              <Text style={styles.depositLabel}>Deposit paid</Text>
              <Text style={styles.depositAmt}>KES {item.depositPaid}</Text>
            </View>
            <View style={styles.bookedBox}>
              <Text style={styles.bookedLabel}>Booked</Text>
              <Text style={styles.bookedVal}>{formatTime(item.bookedAt)}</Text>
            </View>
            <TouchableOpacity style={styles.checkInBtn} onPress={onPress}>
              <Text style={styles.checkInBtnTxt}>Check In →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReservedCheckInScreen() {
  const [reservations, setReservations] = useState(
    [...MOCK_RESERVATIONS].sort((a, b) =>
      new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime()
    )
  );
  const [selected, setSelected]     = useState<Reservation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
  }, []);

  const handleCardPress = (item: Reservation) => {
    setSelected(item);
    setModalVisible(true);
  };

  const handleConfirmCheckIn = () => {
    if (!selected) return;
    setLoading(true);
    // TODO: POST /api/v1/sessions/checkin { reservationId: selected.id }
    setTimeout(() => {
      setLoading(false);
      setModalVisible(false);
      setReservations(prev => prev.filter(r => r.id !== selected.id));
      Alert.alert(
        'Checked In ✅',
        `${selected.plate} — Slot ${selected.slot} is now active`,
        [{ text: 'Done' }]
      );
      setSelected(null);
    }, 1500);
  };

  const pendingCount = reservations.filter(r => minutesUntilArrival(r.expectedArrival) < 0).length;

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
              <Text style={styles.headerTitle}>Reserved Slots</Text>
              <Text style={styles.headerSub}>Tap a card to check the driver in</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countTxt}>{reservations.length}</Text>
            </View>
          </View>

          {/* Summary strip */}
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{reservations.length}</Text>
              <Text style={styles.summaryLbl}>Pending</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: C.red }]}>{pendingCount}</Text>
              <Text style={styles.summaryLbl}>Late</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: C.green }]}>
                {reservations.length - pendingCount}
              </Text>
              <Text style={styles.summaryLbl}>On Time</Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* List */}
      <FlatList
        data={reservations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setTimeout(()=>setRefreshing(false),1000); }}
            tintColor={C.green}
          />
        }
        renderItem={({ item, index }) => (
          <ReservationCard item={item} index={index} onPress={() => handleCardPress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All Checked In</Text>
            <Text style={styles.emptySub}>No pending reservations</Text>
          </View>
        }
      />

      {/* Confirm modal */}
      <ConfirmModal
        reservation={selected}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setSelected(null); }}
        onConfirm={handleConfirmCheckIn}
        loading={loading}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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
  countTxt: { fontSize:16, fontWeight:'700', color:C.white },

  // Summary strip
  summaryStrip: { flexDirection:'row', marginHorizontal:16, backgroundColor:'rgba(255,255,255,0.12)', borderRadius:14, padding:12 },
  summaryItem: { flex:1, alignItems:'center' },
  summaryNum: { fontSize:20, fontWeight:'700', color:C.white },
  summaryLbl: { fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 },
  summaryDivider: { width:1, backgroundColor:'rgba(255,255,255,0.2)' },

  // List
  list: { padding:16, paddingBottom:40 },

  // Card
  card: { backgroundColor:C.white, borderRadius:18, marginBottom:12, flexDirection:'row', overflow:'hidden', ...shadow },
  cardLate: { borderWidth:1, borderColor: C.red + '40' },
  accent: { width:5 },
  cardInner: { flex:1, padding:16 },
  topRow: { flexDirection:'row', alignItems:'center', marginBottom:12 },
  vehicleIconBox: { width:46, height:46, borderRadius:14, backgroundColor: C.greenLight, alignItems:'center', justifyContent:'center', marginRight:12 },
  topInfo: { flex:1 },
  plateTxt: { fontSize:16, fontWeight:'700', color:C.textPrimary },
  driverTxt: { fontSize:13, color:C.textSecondary, marginTop:3 },

  // Chips
  chipsRow: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 },
  chip: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor: C.surface, paddingHorizontal:10, paddingVertical:5, borderRadius:8 },
  chipIcon: { fontSize:12 },
  chipTxt: { fontSize:12, color:C.textSecondary, fontWeight:'500' },

  // Bottom row
  bottomRow: { flexDirection:'row', alignItems:'center', gap:10 },
  depositBox: { flex:1 },
  depositLabel: { fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:0.4 },
  depositAmt: { fontSize:14, fontWeight:'700', color:C.green },
  bookedBox: { flex:1 },
  bookedLabel: { fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:0.4 },
  bookedVal: { fontSize:12, fontWeight:'600', color:C.textSecondary },
  checkInBtn: { backgroundColor: C.green, paddingHorizontal:14, paddingVertical:8, borderRadius:10 },
  checkInBtnTxt: { fontSize:13, fontWeight:'700', color:C.white },

  // Empty
  empty: { alignItems:'center', paddingVertical:80 },
  emptyIcon: { fontSize:56, marginBottom:16 },
  emptyTitle: { fontSize:18, fontWeight:'700', color:C.textPrimary, marginBottom:6 },
  emptySub: { fontSize:14, color:C.textSecondary },
});