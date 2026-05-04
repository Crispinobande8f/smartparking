/**
 * CountyDashboard — app/(county)/index.tsx
 * County official overview: total revenue, monthly bar chart,
 * compliance rate card, lot performance bars.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Animated, StatusBar, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { C, shadow, shadowStrong, scale, W_SCREEN } from '@/constants/theme';
import {
  COUNTY_LOTS, MONTHLY_REVENUE, LOT_REVENUES,
  VIOLATIONS, totalRevenue, CountyLot,
} from '@/constants/countyData';

const BAR_MAX  = Math.max(...MONTHLY_REVENUE.map(r => r.amount));
const BAR_H    = 110;

// ── Animated bar chart ───────────────────────────────────────────────────────
function MonthlyBarChart() {
  const anims = MONTHLY_REVENUE.map(() => useRef(new Animated.Value(0)).current);
  useEffect(() => {
    Animated.stagger(70, anims.map((a, i) =>
      Animated.timing(a, {
        toValue: MONTHLY_REVENUE[i].amount / BAR_MAX,
        duration: 600, delay: 200, useNativeDriver: false,
      })
    )).start();
  }, []);

  return (
    <View style={chart.wrap}>
      <View style={chart.barsRow}>
        {MONTHLY_REVENUE.map((r, i) => {
          const isLast = i === MONTHLY_REVENUE.length - 1;
          return (
            <View key={i} style={chart.barCol}>
              <Animated.View style={[
                chart.bar,
                {
                  height: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, BAR_H] }),
                  backgroundColor: isLast ? C.amber : C.navy,
                },
              ]} />
              <Text style={chart.barLabel}>{r.month}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const chart = StyleSheet.create({
  wrap: { paddingTop: 8 },
  barsRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', height: BAR_H + 24,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '60%', borderRadius: 6, marginBottom: 6 },
  barLabel: { fontSize: scale(10), color: C.textSecondary },
});

// ── Lot performance bar row ───────────────────────────────────────────────────
function LotPerfRow({ name, amount, occupancy, color, delay }: {
  name: string; amount: number; occupancy: number; color: string; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: occupancy / 100, duration: 700, delay, useNativeDriver: false }),
      Animated.timing(fade, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  const barW = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const pctColor = occupancy >= 80 ? C.red : occupancy >= 60 ? C.amber : C.green;

  return (
    <Animated.View style={{ opacity: fade, marginBottom: 16 }}>
      <View style={perf.headerRow}>
        <Text style={perf.name}>{name}</Text>
        <Text style={[perf.amount, { color: C.green }]}>
          KES {(amount / 1000).toFixed(1)}K
        </Text>
        <Text style={[perf.pct, { color: pctColor }]}>{occupancy}%</Text>
      </View>
      <View style={perf.track}>
        <Animated.View style={[perf.fill, { width: barW, backgroundColor: color }]} />
      </View>
    </Animated.View>
  );
}
const perf = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  name: { flex: 1, fontSize: scale(13), fontWeight: '500', color: C.textPrimary },
  amount: { fontSize: scale(13), fontWeight: '700', marginRight: 10 },
  pct: { fontSize: scale(13), fontWeight: '700', width: 36, textAlign: 'right' },
  track: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, valueColor, delay }: {
  value: string; label: string; valueColor: string; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { opacity: anim }]}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CountyDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim   = useRef(new Animated.Value(20)).current;
  const bodyFade   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(bodyFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(bodyAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const totalRev    = totalRevenue(COUNTY_LOTS);
  const thisMonth   = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].amount;
  const activeLots  = COUNTY_LOTS.filter(l => l.status === 'active').length;
  const pendingViol = VIOLATIONS.filter(v => v.status === 'pending').length;
  const resolvedViol= VIOLATIONS.filter(v => v.status === 'paid').length;
  const totalFines  = VIOLATIONS.reduce((s, v) => s + v.fine, 0);
  const complianceRate = 87.5;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBox}>
                <Text style={styles.logoIcon}>🏛️</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>County Overview</Text>
                <Text style={styles.headerSub}>Amina Hassan</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn}
                onPress={() => router.push('/county/revenue-analytics')}>
                <Text style={styles.iconBtnTxt}>📊</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}
                onPress={() => router.replace('/(tabs)')}>
                <Text style={styles.iconBtnTxt}>⇥</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Authority strip */}
          <View style={styles.authorityStrip}>
            <Text style={styles.authIcon}>🏢</Text>
            <Text style={styles.authTxt}>Nairobi County · Parking Authority</Text>
            <Text style={styles.authLots}>{activeLots} Active Lots</Text>
          </View>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }}
            tintColor={C.green} />
        }
      >
        <Animated.View style={{ opacity: bodyFade, transform: [{ translateY: bodyAnim }] }}>

          {/* ── Top stat cards ── */}
          <View style={styles.statsRow}>
            <StatCard value={`KES ${(totalRev / 1000000).toFixed(2)}M`}
              label="Total Revenue" valueColor={C.green} delay={0} />
            <StatCard value={`KES ${(thisMonth / 1000).toFixed(1)}K`}
              label="This Month" valueColor={C.amber} delay={80} />
            <StatCard value={String(COUNTY_LOTS.length)}
              label="Parking Lots" valueColor={C.dark} delay={160} />
          </View>

          {/* ── Monthly Revenue Chart ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Revenue</Text>
            <Text style={styles.cardSub}>Last 7 months</Text>
            <MonthlyBarChart />
          </View>

          {/* ── Compliance Rate ── */}
          <TouchableOpacity
            style={styles.complianceCard}
            onPress={() => router.push('/(tabs)/county/compliance')}
            activeOpacity={0.88}
          >
            <View>
              <Text style={styles.complianceLabel}>Compliance Rate</Text>
              <Text style={styles.complianceRate}>{complianceRate}%</Text>
              <Text style={styles.complianceViol}>
                {pendingViol + resolvedViol} violations this month
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => router.push('/(tabs)/county/compliance')}
            >
              <Text style={styles.viewDetailsTxt}>View Details</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* ── Lot Performance ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lot Performance</Text>
            <View style={{ marginTop: 16 }}>
              {LOT_REVENUES.map((l, i) => (
                <LotPerfRow key={i} {...l} delay={i * 80} />
              ))}
            </View>
          </View>

          {/* ── Manage Slots shortcut ── */}
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => router.push('/(tabs)/county/manage-slots')}
            activeOpacity={0.85}
          >
            <Text style={styles.manageBtnIcon}>🅿️</Text>
            <Text style={styles.manageBtnTxt}>Manage All Parking Slots</Text>
            <Text style={styles.manageBtnArrow}>›</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.surface },
  header: { backgroundColor: C.navy, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    paddingTop: 8, paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoIcon: { fontSize: 22 },
  headerTitle: { fontSize: scale(17), fontWeight: '700', color: C.white },
  headerSub: { fontSize: scale(12), color: C.amber, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnTxt: { fontSize: 16, color: C.white },
  authorityStrip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  authIcon: { fontSize: 16 },
  authTxt: { flex: 1, fontSize: scale(13), color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  authLots: { fontSize: scale(12), color: C.amber, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 48 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 16,
    padding: 14, alignItems: 'flex-start', ...shadow,
  },
  statValue: { fontSize: scale(15), fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  statLabel: { fontSize: scale(11), color: C.textSecondary },

  // Card
  card: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 18, marginBottom: 12, ...shadow,
  },
  cardTitle: { fontSize: scale(16), fontWeight: '700', color: C.textPrimary },
  cardSub: { fontSize: scale(12), color: C.textSecondary, marginTop: 2 },

  // Compliance
  complianceCard: {
    backgroundColor: C.navy, borderRadius: 20, padding: 24,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
    ...shadowStrong,
  },
  complianceLabel: { fontSize: scale(13), color: 'rgba(255,255,255,0.65)', marginBottom: 6 },
  complianceRate: { fontSize: scale(36), fontWeight: '800', color: C.white, letterSpacing: -1 },
  complianceViol: { fontSize: scale(12), color: C.amber, marginTop: 6, fontWeight: '500' },
  viewDetailsBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  viewDetailsTxt: { fontSize: scale(13), fontWeight: '600', color: C.white },

  // Manage button
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.white, borderRadius: 16,
    padding: 18, ...shadow,
  },
  manageBtnIcon: { fontSize: 22 },
  manageBtnTxt: { flex: 1, fontSize: scale(14), fontWeight: '600', color: C.textPrimary },
  manageBtnArrow: { fontSize: 22, color: C.textMuted },
});