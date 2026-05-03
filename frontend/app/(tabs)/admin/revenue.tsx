/**
 * RevenueScreen — app/(admin)/revenue.tsx
 * Shows: total revenue hero card, trend line chart, revenue by lot, transaction summary
 */
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Animated, StatusBar, Dimensions,
} from 'react-native';
import { NavHeader } from '@/components/NavHeader';
import { colors, shadows, scale } from '@/constants/theme';
import { MONTHLY_REVENUE, LOT_REVENUES, TRANSACTIONS } from '@/constants/adminData';

const { width: W } = Dimensions.get('window');
const CHART_W = W - 64; // card padding
const CHART_H = 140;

// ── Simple SVG-free line chart using Animated Views ──────────────────────────
function LineChart({ data }: { data: Array<{ label:string; value:number }> }) {
  const animValues = data.map(() => useRef(new Animated.Value(0)).current);
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;

  useEffect(() => {
    Animated.stagger(40, animValues.map((a, i) =>
      Animated.timing(a, { toValue:1, duration:500, delay:200, useNativeDriver:false })
    )).start();
  }, []);

  // Compute dot positions
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_W,
    y: CHART_H - ((d.value - min) / range) * (CHART_H - 20),
    label: d.label,
    value: d.value,
  }));

  return (
    <View style={{ height: CHART_H + 32, position:'relative' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <View key={i} style={[styles.gridLine, { bottom: f * CHART_H + 24 }]} />
      ))}

      {/* Area fill (approximate with gradient rows) */}
      <View style={styles.chartArea}>
        {points.map((p, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const segW = p.x - prev.x;
          const avgY = (p.y + prev.y) / 2;
          return (
            <View key={i} style={[styles.areaSegment, {
              left: prev.x, width: segW,
              top: avgY, height: CHART_H - avgY + 24,
            }]} />
          );
        })}
      </View>

      {/* Dots */}
      {points.map((p, i) => (
        <Animated.View key={i} style={[styles.dot, {
          left: p.x - 5,
          top: p.y + 12,
          opacity: animValues[i],
          transform: [{ scale: animValues[i].interpolate({ inputRange:[0,1], outputRange:[0,1] }) }],
        }]} />
      ))}

      {/* X-axis labels (show every other) */}
      <View style={[styles.xAxis, { bottom: 0 }]}>
        {points.filter((_, i) => i % 2 === 0).map((p, i) => (
          <Text key={i} style={styles.xLabel}>{p.label}</Text>
        ))}
      </View>
    </View>
  );
}

// ── Revenue Bar ────────────────────────────────────────────────────────────────
function LotRevenueBar({ name, amount, color, maxAmount }: {
  name:string; amount:number; color:string; maxAmount:number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: amount / maxAmount, duration:700, delay:300, useNativeDriver:false }).start();
  }, []);
  const barW = anim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] });
  return (
    <View style={styles.lotBar}>
      <View style={styles.lotBarHeader}>
        <View style={styles.lotBarLeft}>
          <View style={[styles.lotDot, { backgroundColor: color }]} />
          <Text style={styles.lotName}>{name}</Text>
        </View>
        <Text style={[styles.lotAmount, { color }]}>
          KES {(amount / 1000).toFixed(1)}K
        </Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barW, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Transaction Summary Row ───────────────────────────────────────────────────
function SummaryRow({ label, value, valueColor = colors.textPrimary }:
  { label:string; value:string|number; valueColor?:string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RevenueScreen() {
  const heroAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(heroAnim, { toValue:1, duration:500, useNativeDriver:true }).start();
  }, []);

  const totalCollected = TRANSACTIONS.reduce((s, t) => s + t.amount, 0);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <NavHeader title="Revenue Analytics" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero revenue card */}
        <Animated.View style={[styles.heroCard, { opacity: heroAnim }]}>
          <Text style={styles.heroLabel}>Total Revenue Collected</Text>
          <Text style={styles.heroAmount}>KES 1.24M</Text>
          <View style={styles.heroMonthRow}>
            <Text style={styles.heroArrow}>↗</Text>
            <Text style={styles.heroMonth}>This Month: KES 48.8K</Text>
          </View>
        </Animated.View>

        {/* Revenue Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revenue Trend</Text>
          <LineChart data={MONTHLY_REVENUE} />
        </View>

        {/* Revenue by Lot */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revenue by Lot</Text>
          <View style={styles.lotBars}>
            {LOT_REVENUES.map((l, i) => (
              <LotRevenueBar key={i} {...l} />
            ))}
          </View>
        </View>

        {/* Transaction Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction Summary</Text>
          <View style={styles.summaryTable}>
            <SummaryRow label="Total Transactions" value={TRANSACTIONS.length} />
            <View style={styles.divider} />
            <SummaryRow label="Successful" value={TRANSACTIONS.length - 1} valueColor={colors.green} />
            <View style={styles.divider} />
            <SummaryRow label="Failed"     value={1} valueColor={colors.red} />
            <View style={styles.divider} />
            <SummaryRow label="Total Collected" value={`KES ${totalCollected}`} valueColor={colors.green} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, backgroundColor: colors.surface },
  scroll: { padding:16, paddingBottom:48 },

  // Hero
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius:20, padding:24, marginBottom:12,
    alignItems:'center',
    ...shadows.strong,
  },
  heroLabel: { fontSize:scale(13), color:'rgba(255,255,255,0.65)', marginBottom:8 },
  heroAmount: { fontSize:scale(36), fontWeight:'800', color:colors.white, letterSpacing:-1 },
  heroMonthRow: { flexDirection:'row', alignItems:'center', gap:6, marginTop:10 },
  heroArrow: { fontSize:16, color:colors.green },
  heroMonth: { fontSize:scale(14), color:colors.green, fontWeight:'600' },

  // Card
  card: { backgroundColor:colors.white, borderRadius:20, padding:20, marginBottom:12, ...shadows.card },
  cardTitle: { fontSize:scale(16), fontWeight:'700', color:colors.textPrimary, marginBottom:16 },

  // Line chart
  gridLine: { position:'absolute', left:0, right:0, height:1, backgroundColor:colors.border },
  chartArea: { position:'absolute', top:0, left:0, right:0, bottom:24 },
  areaSegment: { position:'absolute', backgroundColor:'rgba(0,196,140,0.08)' },
  dot: { position:'absolute', width:10, height:10, borderRadius:5, backgroundColor:colors.amber, borderWidth:2, borderColor:colors.white },
  xAxis: { position:'absolute', left:0, right:0, flexDirection:'row', justifyContent:'space-between', paddingHorizontal:4 },
  xLabel: { fontSize:scale(9), color:colors.textSecondary },

  // Lot bars
  lotBars: { gap:16 },
  lotBar: { gap:8 },
  lotBarHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  lotBarLeft: { flexDirection:'row', alignItems:'center', gap:8 },
  lotDot: { width:10, height:10, borderRadius:5 },
  lotName: { fontSize:scale(14), fontWeight:'500', color:colors.textPrimary },
  lotAmount: { fontSize:scale(14), fontWeight:'700' },
  barTrack: { height:8, backgroundColor:colors.border, borderRadius:4, overflow:'hidden' },
  barFill: { height:'100%', borderRadius:4 },

  // Summary table
  summaryTable: { gap:0 },
  summaryRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12 },
  summaryLabel: { fontSize:scale(14), color:colors.textSecondary },
  summaryValue: { fontSize:scale(15), fontWeight:'700' },
  divider: { height:1, backgroundColor:colors.border },
});