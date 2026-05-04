/**
 * CountyLotDetail — app/(county)/lot-detail.tsx
 * Full detail for one parking lot:
 * - Stat cards (occupied %, reserved %, available %)
 * - Live vehicle list with plate, slot, elapsed time
 * Receives: lotId param
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, Animated, StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { C, shadow, shadowStrong, scale, W_SCREEN } from '@/constants/theme';
import {
  COUNTY_LOTS, LOT_VEHICLES, VehicleInLot,
  pct, pctNum, getElapsed,
} from '@/constants/countyData';

// ── Ring chart (pure RN, no SVG) ─────────────────────────────────────────────
// Simulated with concentric arcs using rotated View borders
function RingChart({ value, total, color, label }: {
  value: number; total: number; color: string; label: string;
}) {
  const p = pctNum(value, total);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: p / 100, duration: 800, delay: 300, useNativeDriver: false }).start();
  }, []);

  return (
    <View style={ring.wrap}>
      {/* Background ring */}
      <View style={ring.track} />
      {/* Filled arc approximated with a rotation mask */}
      <View style={[ring.fill, { borderColor: color }]} />
      {/* Center text */}
      <View style={ring.center}>
        <Text style={[ring.pct, { color }]}>{p}%</Text>
        <Text style={ring.lbl}>{label}</Text>
        <Text style={ring.val}>{value}</Text>
      </View>
    </View>
  );
}
const RING = 72;
const ring = StyleSheet.create({
  wrap: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  track: {
    position: 'absolute', width: RING, height: RING, borderRadius: RING / 2,
    borderWidth: 7, borderColor: C.border,
  },
  fill: {
    position: 'absolute', width: RING, height: RING, borderRadius: RING / 2,
    borderWidth: 7, borderTopColor: 'transparent', borderRightColor: 'transparent',
  },
  center: { alignItems: 'center' },
  pct: { fontSize: scale(14), fontWeight: '800', letterSpacing: -0.5 },
  lbl: { fontSize: scale(8), color: C.textMuted, marginTop: 1 },
  val: { fontSize: scale(10), fontWeight: '600', color: C.textSecondary },
});

// ── Stat card with number + percentage ────────────────────────────────────────
function StatCard({
  label, value, total, color, icon, delay,
}: {
  label: string; value: number; total: number;
  color: string; icon: string; delay: number;
}) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;
  const p = pctNum(value, total);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  // Animated number bar
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: p / 100, duration: 700, delay: delay + 200, useNativeDriver: false }).start();
  }, []);
  const barW = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[stat.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={[stat.iconBox, { backgroundColor: color + '20' }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={[stat.value, { color }]}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
      <View style={stat.pctRow}>
        <View style={stat.barTrack}>
          <Animated.View style={[stat.barFill, { width: barW, backgroundColor: color }]} />
        </View>
        <Text style={[stat.pctTxt, { color }]}>{p}%</Text>
      </View>
    </Animated.View>
  );
}

const stat = StyleSheet.create({
  card: {
    width: (W_SCREEN - 48) / 3,
    backgroundColor: C.white, borderRadius: 16,
    padding: 14, alignItems: 'center', ...shadow,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  value: { fontSize: scale(22), fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: scale(10), color: C.textSecondary, marginTop: 2, marginBottom: 8, textAlign: 'center' },
  pctRow: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '100%' },
  barTrack: { flex: 1, height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  pctTxt: { fontSize: scale(10), fontWeight: '700', width: 30, textAlign: 'right' },
});

// ── Vehicle row ───────────────────────────────────────────────────────────────
function VehicleRow({ vehicle, index }: { vehicle: VehicleInLot; index: number }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 300, delay: Math.min(index * 50, 800), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 300, delay: Math.min(index * 50, 800), useNativeDriver: true }),
    ]).start();
  }, []);

  const statusConfig = {
    active:   { color: C.green,  bg: C.greenLight,    label: 'Active'   },
    reserved: { color: C.amber,  bg: '#FFF3CD',        label: 'Reserved' },
    overstay: { color: C.red,    bg: '#FDEAEA',        label: 'Overstay' },
  }[vehicle.status];

  return (
    <Animated.View style={[vRow.row, { opacity: fade, transform: [{ translateY: slide }] }]}>
      {/* Icon */}
      <View style={[vRow.iconBox, { backgroundColor: statusConfig.bg }]}>
        <Text style={{ fontSize: 18 }}>🚗</Text>
      </View>

      {/* Info */}
      <View style={vRow.info}>
        <Text style={vRow.plate}>{vehicle.plate}</Text>
        <Text style={vRow.meta}>
          {vehicle.zone} · Slot {vehicle.slotCode} · {vehicle.driverName}
        </Text>
      </View>

      {/* Right: elapsed + status */}
      <View style={vRow.right}>
        <Text style={vRow.elapsed}>{getElapsed(vehicle.checkedInAt)}</Text>
        <View style={[vRow.statusPill, { backgroundColor: statusConfig.bg }]}>
          <Text style={[vRow.statusTxt, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const vRow = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 14,
    padding: 12, marginBottom: 8, ...shadow,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  plate: { fontSize: scale(14), fontWeight: '700', color: C.textPrimary },
  meta: { fontSize: scale(11), color: C.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  elapsed: { fontSize: scale(13), fontWeight: '700', color: C.textPrimary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusTxt: { fontSize: scale(10), fontWeight: '700' },
});

// ── Filter tab ────────────────────────────────────────────────────────────────
type FilterType = 'all' | 'active' | 'reserved' | 'overstay';

function FilterTab({ label, active, onPress, count }: {
  label: string; active: boolean; onPress: () => void; count: number;
}) {
  return (
    <TouchableOpacity
      style={[fTab.tab, active && fTab.tabActive]}
      onPress={onPress} activeOpacity={0.75}
    >
      <Text style={[fTab.txt, active && fTab.txtActive]}>{label}</Text>
      <View style={[fTab.badge, active && fTab.badgeActive]}>
        <Text style={[fTab.badgeTxt, active && fTab.badgeTxtActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}
const fTab = StyleSheet.create({
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  tabActive: { backgroundColor: C.navy, borderColor: C.navy },
  txt: { fontSize: scale(12), fontWeight: '600', color: C.textSecondary },
  txtActive: { color: C.white },
  badge: {
    backgroundColor: C.border, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeTxt: { fontSize: scale(10), fontWeight: '700', color: C.textSecondary },
  badgeTxtActive: { color: C.white },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CountyLotDetail() {
  const { lotId } = useLocalSearchParams<{ lotId: string }>();
  const [filter, setFilter] = useState<FilterType>('all');

  const lot      = COUNTY_LOTS.find(l => l.id === lotId);
  const vehicles = LOT_VEHICLES[lotId ?? ''] ?? [];

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  if (!lot) return null;

  const filtered = filter === 'all'
    ? vehicles
    : vehicles.filter(v => v.status === filter);

  const counts = {
    all:      vehicles.length,
    active:   vehicles.filter(v => v.status === 'active').length,
    reserved: vehicles.filter(v => v.status === 'reserved').length,
    overstay: vehicles.filter(v => v.status === 'overstay').length,
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
              <Text style={styles.headerTitle}>{lot.name}</Text>
              <Text style={styles.headerSub}>{lot.address}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <FlatList
        data={filtered}
        keyExtractor={v => v.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <>
            {/* Stat cards */}
            <View style={styles.statsRow}>
              <StatCard
                label="Occupied" value={lot.occupied}
                total={lot.totalSlots} color={C.red} icon="🚗" delay={0} />
              <StatCard
                label="Reserved" value={lot.reserved}
                total={lot.totalSlots} color={C.amber} icon="🔒" delay={80} />
              <StatCard
                label="Available" value={lot.available}
                total={lot.totalSlots} color={C.green} icon="✅" delay={160} />
            </View>

            {/* Summary row */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNum}>{lot.totalSlots}</Text>
                <Text style={styles.summaryLbl}>Total Slots</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: C.amber }]}>
                  KES {lot.ratePerHour}/hr
                </Text>
                <Text style={styles.summaryLbl}>Rate</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: C.green }]}>
                  KES {(lot.revenue / 1000).toFixed(1)}K
                </Text>
                <Text style={styles.summaryLbl}>Revenue</Text>
              </View>
            </View>

            {/* Vehicle list header + filter */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Vehicles in Lot</Text>
              <Text style={styles.listCount}>{vehicles.length} vehicles</Text>
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
              {([
                { key: 'all',      label: 'All'      },
                { key: 'active',   label: 'Active'   },
                { key: 'reserved', label: 'Reserved' },
                { key: 'overstay', label: 'Overstay' },
              ] as Array<{ key: FilterType; label: string }>).map(f => (
                <FilterTab
                  key={f.key}
                  label={f.label}
                  active={filter === f.key}
                  count={counts[f.key]}
                  onPress={() => setFilter(f.key)}
                />
              ))}
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <VehicleRow vehicle={item} index={index} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🅿️</Text>
            <Text style={styles.emptyTxt}>No vehicles in this category</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.surface },
  header: { backgroundColor: C.navy, paddingBottom: 12 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: C.white, fontWeight: '300', lineHeight: 30 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: scale(16), fontWeight: '700', color: C.white },
  headerSub: { fontSize: scale(11), color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 48 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row', backgroundColor: C.navy,
    borderRadius: 16, padding: 16, marginBottom: 20,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: scale(14), fontWeight: '800', color: C.white },
  summaryLbl: { fontSize: scale(10), color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  listTitle: { fontSize: scale(16), fontWeight: '700', color: C.textPrimary },
  listCount: { fontSize: scale(12), color: C.textSecondary },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTxt: { fontSize: scale(14), color: C.textSecondary },
});