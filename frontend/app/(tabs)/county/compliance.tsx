/**
 * ComplianceScreen — app/(county)/compliance.tsx
 * Shows: compliance rate ring, stat cards, violations list.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, Animated, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { C, shadow, shadowStrong, scale } from '@/constants/theme';
import { VIOLATIONS, Violation } from '@/constants/countyData';

// ── Compliance ring (animated border) ────────────────────────────────────────
function ComplianceRing({ rate }: { rate: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: false }).start();
  }, []);
  const ratingLabel = rate >= 90 ? 'Excellent' : rate >= 75 ? 'Needs improvement' : 'Critical';
  const ratingColor = rate >= 90 ? C.green : rate >= 75 ? C.amber : C.red;

  return (
    <View style={ring.card}>
      {/* Ring visual */}
      <View style={ring.ringWrap}>
        <View style={ring.track} />
        <View style={[ring.arc, { borderColor: C.amber }]} />
        <View style={ring.center}>
          <Text style={[ring.pct, { color: C.amber }]}>{rate}%</Text>
        </View>
      </View>

      {/* Text */}
      <View style={ring.textBlock}>
        <Text style={ring.title}>Compliance Rate</Text>
        <Text style={[ring.rating, { color: ratingColor }]}>{ratingLabel}</Text>
        <Text style={ring.sub}>
          {VIOLATIONS.length} violations this month
        </Text>
      </View>
    </View>
  );
}

const RING_SIZE = 88;
const ring = StyleSheet.create({
  card: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 20, flexDirection: 'row', alignItems: 'center',
    gap: 20, marginBottom: 12, ...shadow,
  },
  ringWrap: {
    width: RING_SIZE, height: RING_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  track: {
    position: 'absolute', width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2, borderWidth: 9, borderColor: C.border,
  },
  arc: {
    position: 'absolute', width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2, borderWidth: 9,
    borderTopColor: 'transparent', borderRightColor: 'transparent',
    transform: [{ rotate: '-30deg' }],
  },
  center: { alignItems: 'center' },
  pct: { fontSize: scale(18), fontWeight: '800' },
  textBlock: { flex: 1 },
  title: { fontSize: scale(17), fontWeight: '700', color: C.textPrimary },
  rating: { fontSize: scale(13), fontWeight: '600', marginTop: 4 },
  sub: { fontSize: scale(12), color: C.textSecondary, marginTop: 4 },
});

// ── Stat cards row ────────────────────────────────────────────────────────────
function ViolationStatCard({ value, label, color, delay }: {
  value: string | number; label: string; color: string; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[sc.card, { opacity: anim }]}>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </Animated.View>
  );
}
const sc = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: C.white, borderRadius: 16,
    padding: 16, alignItems: 'center', ...shadow,
  },
  value: { fontSize: scale(24), fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: scale(12), color: C.textSecondary, marginTop: 4 },
});

// ── Violation row ─────────────────────────────────────────────────────────────
function ViolationRow({ item, index }: { item: Violation; index: number }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 300, delay: index * 70, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 300, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const isPaid = item.status === 'paid';

  return (
    <Animated.View style={[vr.row, { opacity: fade, transform: [{ translateY: slide }] }]}>
      {/* Icon */}
      <View style={[vr.iconBox, {
        backgroundColor: isPaid ? C.greenLight : '#FFF3CD',
      }]}>
        <Text style={{ fontSize: 20 }}>
          {isPaid ? '✅' : '⚠️'}
        </Text>
      </View>

      {/* Info */}
      <View style={vr.info}>
        <View style={vr.titleRow}>
          <Text style={vr.plate}>{item.plate}</Text>
          <View style={[vr.statusPill, {
            backgroundColor: isPaid ? C.greenLight : '#FFF3CD',
          }]}>
            <Text style={[vr.statusTxt, {
              color: isPaid ? C.green : C.amber,
            }]}>
              {isPaid ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>
        <Text style={vr.meta}>
          {item.type} · {item.lot} · {item.time}
        </Text>
      </View>

      {/* Amount */}
      <Text style={[vr.fine, { color: C.amber }]}>
        KES {item.fine.toLocaleString()}
      </Text>
    </Animated.View>
  );
}

const vr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 16,
    padding: 14, marginBottom: 10, ...shadow,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  plate: { fontSize: scale(14), fontWeight: '700', color: C.textPrimary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusTxt: { fontSize: scale(10), fontWeight: '700' },
  meta: { fontSize: scale(11), color: C.textSecondary },
  fine: { fontSize: scale(14), fontWeight: '800' },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ComplianceScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const pending = VIOLATIONS.filter(v => v.status === 'pending');
  const paid    = VIOLATIONS.filter(v => v.status === 'paid');
  const totalFines = VIOLATIONS.reduce((s, v) => s + v.fine, 0);

  const filtered = filter === 'all' ? VIOLATIONS
    : VIOLATIONS.filter(v => v.status === filter);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Header */}
      <SafeAreaView style={{ backgroundColor: C.navy }}>
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compliance & Violations</Text>
          <View style={{ width: 40 }} />
        </Animated.View>
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={v => v.id}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Compliance ring */}
            <ComplianceRing rate={87.5} />

            {/* Stat cards */}
            <View style={styles.statsRow}>
              <ViolationStatCard value={pending.length} label="Pending"    color={C.amber} delay={0}   />
              <ViolationStatCard value={paid.length}    label="Resolved"   color={C.green} delay={80}  />
              <ViolationStatCard value={`KES ${totalFines.toLocaleString()}`} label="Total Fines" color={C.textPrimary} delay={160} />
            </View>

            {/* Section header + filter */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Recent Violations</Text>
            </View>
            <View style={styles.filterRow}>
              {(['all', 'pending', 'paid'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterTab, filter === f && styles.filterTabActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item, index }) => <ViolationRow item={item} index={index} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTxt}>No violations found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.navy,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: C.white, fontWeight: '300', lineHeight: 30 },
  headerTitle: { fontSize: scale(17), fontWeight: '700', color: C.white },
  scroll: { padding: 16, paddingBottom: 48 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  listHeader: { marginBottom: 10 },
  listTitle: { fontSize: scale(16), fontWeight: '700', color: C.textPrimary },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterTxt: { fontSize: scale(13), fontWeight: '600', color: C.textSecondary },
  filterTxtActive: { color: C.white },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { fontSize: scale(14), color: C.textSecondary },
});