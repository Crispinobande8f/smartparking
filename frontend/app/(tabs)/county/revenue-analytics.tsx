/**
 * CountyRevenueAnalytics — app/(county)/revenue-analytics.tsx
 * Shows: hero total, line trend chart, revenue by lot bars,
 * transaction summary. Matches the screenshot exactly.
 */
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Animated, StatusBar, SafeAreaView, TouchableOpacity, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { C, shadow, shadowStrong, scale } from '@/constants/theme';
import { MONTHLY_REVENUE, LOT_REVENUES, COUNTY_LOTS, totalRevenue } from '@/constants/countyData';

const { width: W } = Dimensions.get('window');
const CHART_W = W - 80;
const CHART_H = 140;

// ── Smooth line + area chart ──────────────────────────────────────────────────
function LineTrendChart() {
  const lineAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(lineAnim, { toValue: 1, duration: 900, delay: 200, useNativeDriver: false }).start();
  }, []);

  const max = Math.max(...MONTHLY_REVENUE.map(d => d.amount));
  const min = Math.min(...MONTHLY_REVENUE.map(d => d.amount));
  const range = max - min || 1;

  const points = MONTHLY_REVENUE.map((d, i) => ({
    x: (i / (MONTHLY_REVENUE.length - 1)) * CHART_W,
    y: CHART_H - ((d.amount - min) / range) * (CHART_H - 20),
    month: d.month,
    amount: d.amount,
  }));

  return (
    <View style={{ height: CHART_H + 36, position: 'relative' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <View key={i} style={[ltc.grid, { bottom: f * CHART_H + 24 }]} />
      ))}

      {/* Area fills between points */}
      {points.map((p, i) => {
        if (i === 0) return null;
        const prev = points[i - 1];
        const midY = (p.y + prev.y) / 2;
        return (
          <View key={i} style={{
            position: 'absolute',
            left: prev.x, width: p.x - prev.x,
            top: midY + 8, height: CHART_H - midY + 16,
            backgroundColor: 'rgba(0,196,140,0.08)',
          }} />
        );
      })}

      {/* Connection segments */}
      {points.map((p, i) => {
        if (i === 0) return null;
        const prev = points[i - 1];
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const isLast = i === points.length - 1;
        return (
          <Animated.View key={i} style={{
            position: 'absolute',
            left: prev.x, top: prev.y + 10,
            width: lineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, len] }),
            height: 2.5, borderRadius: 2,
            backgroundColor: isLast ? C.green : C.amber,
            transform: [{ rotate: `${angle}deg` }],
          }} />
        );
      })}

      {/* Dots */}
      {points.map((p, i) => (
        <View key={i} style={[ltc.dot, { left: p.x - 5, top: p.y + 5 }]} />
      ))}

      {/* X labels */}
      <View style={ltc.xAxis}>
        {points.map((p, i) => (
          <Text key={i} style={ltc.xLabel}>{p.month}</Text>
        ))}
      </View>
    </View>
  );
}

const ltc = StyleSheet.create({
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: C.border },
  dot: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.amber, borderWidth: 2.5, borderColor: C.white, zIndex: 2,
  },
  xAxis: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  xLabel: { fontSize: scale(9), color: C.textSecondary },
});

// ── Revenue by lot bar ────────────────────────────────────────────────────────
function LotRevenueBar({ name, amount, color, maxAmount, delay }: {
  name: string; amount: number; color: string; maxAmount: number; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: amount / maxAmount, duration: 700, delay, useNativeDriver: false }),
      Animated.timing(fade, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  const barW = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[lrb.wrap, { opacity: fade }]}>
      <View style={lrb.headerRow}>
        <View style={lrb.dotName}>
          <View style={[lrb.dot, { backgroundColor: color }]} />
          <Text style={lrb.name}>{name}</Text>
        </View>
        <Text style={[lrb.amount, { color: C.textPrimary }]}>
          KES {(amount / 1000).toFixed(1)}K
        </Text>
      </View>
      <View style={lrb.track}>
        <Animated.View style={[lrb.fill, { width: barW, backgroundColor: color }]} />
      </View>
    </Animated.View>
  );
}
const lrb = StyleSheet.create({
  wrap: { marginBottom: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dotName: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: scale(13), fontWeight: '500', color: C.textPrimary },
  amount: { fontSize: scale(14), fontWeight: '700' },
  track: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

// ── Summary row ───────────────────────────────────────────────────────────────
function SummaryRow({ label, value, valueColor = C.textPrimary }: {
  label: string; value: string | number; valueColor?: string;
}) {
  return (
    <View style={sr.row}>
      <Text style={sr.label}>{label}</Text>
      <Text style={[sr.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}
const sr = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 13,
  },
  label: { fontSize: scale(14), color: C.textSecondary },
  value: { fontSize: scale(15), fontWeight: '700' },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CountyRevenueAnalytics() {
  const heroAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const lots = COUNTY_LOTS;
  const total = totalRevenue(lots);
  const maxRevenue = Math.max(...LOT_REVENUES.map(l => l.amount));

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Header */}
      <SafeAreaView style={{ backgroundColor: C.navy }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revenue Analytics</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: heroAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Hero card ── */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Revenue Collected</Text>
            <Text style={styles.heroAmount}>
              KES {(total / 1000000).toFixed(2)}M
            </Text>
            <View style={styles.heroMonthRow}>
              <Text style={styles.heroArrow}>↗</Text>
              <Text style={styles.heroMonth}>
                This Month: KES {(MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].amount / 1000).toFixed(1)}K
              </Text>
            </View>
          </View>

          {/* ── Revenue Trend ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Revenue Trend</Text>
            <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
              <LineTrendChart />
            </View>
          </View>

          {/* ── Revenue by Lot ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Revenue by Lot</Text>
            <View style={{ marginTop: 16 }}>
              {LOT_REVENUES.map((l, i) => (
                <LotRevenueBar
                  key={i}
                  name={l.name}
                  amount={l.amount}
                  color={l.color}
                  maxAmount={maxRevenue}
                  delay={i * 100}
                />
              ))}
            </View>
          </View>

          {/* ── Transaction Summary ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Summary</Text>
            <View style={styles.divider} />
            <SummaryRow label="Total Transactions" value={5} />
            <View style={styles.divider} />
            <SummaryRow label="Successful" value={4} valueColor={C.green} />
            <View style={styles.divider} />
            <SummaryRow label="Failed" value={1} valueColor={C.red} />
            <View style={styles.divider} />
            <SummaryRow
              label="Total Collected"
              value={`KES ${lots.reduce((s, l) => s + l.revenue, 0).toLocaleString()}`}
              valueColor={C.green}
            />
          </View>

        </Animated.View>
      </ScrollView>
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
  heroCard: {
    backgroundColor: C.navy, borderRadius: 20,
    padding: 24, alignItems: 'center',
    marginBottom: 12, ...shadowStrong,
  },
  heroLabel: { fontSize: scale(13), color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  heroAmount: {
    fontSize: scale(38), fontWeight: '800',
    color: C.white, letterSpacing: -1,
  },
  heroMonthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  heroArrow: { fontSize: 16, color: C.green },
  heroMonth: { fontSize: scale(14), color: C.green, fontWeight: '600' },
  card: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 20, marginBottom: 12, ...shadow,
  },
  cardTitle: { fontSize: scale(16), fontWeight: '700', color: C.textPrimary },
  divider: { height: 1, backgroundColor: C.border },
});