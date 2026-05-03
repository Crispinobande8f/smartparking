/**
 * ReportsScreen — app/(admin)/reports.tsx
 * Shows: 4 stat cards, revenue trend line chart, recent transactions list
 */
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  StatusBar, Dimensions, RefreshControl,
} from 'react-native';
import { NavHeader } from '@/components/NavHeader';
import { colors, shadows, scale } from '@/constants/theme';
import { TRANSACTIONS, WEEKLY_REVENUE } from '@/constants/adminData';
import { useState } from 'react';

const { width: W } = Dimensions.get('window');
const CHART_W = W - 64;
const CHART_H = 140;

// ── Smooth curve line chart ───────────────────────────────────────────────────
function TrendChart({ data }: { data: Array<{ label:string; value:number }> }) {
  const lineAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(lineAnim, { toValue:1, duration:800, delay:200, useNativeDriver:false }).start();
  }, []);

  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_W,
    y: CHART_H - ((d.value - min) / range) * (CHART_H - 20),
    label: d.label,
  }));

  return (
    <View style={{ height: CHART_H + 32 }}>
      {/* Grid lines */}
      {[0.33, 0.66, 1].map((f, i) => (
        <View key={i} style={[styles.gridLine, { bottom: f * CHART_H + 24 }]} />
      ))}

      {/* Area fill segments */}
      <View style={StyleSheet.absoluteFill}>
        {points.map((p, i) => {
          if (i === 0) return null;
          const prev = points[i-1];
          const segW = p.x - prev.x;
          const topY = Math.min(p.y, prev.y);
          return (
            <View key={i} style={{
              position:'absolute',
              left: prev.x, width: segW,
              top: topY + 8,
              height: CHART_H - topY + 16,
              backgroundColor:'rgba(0,196,140,0.1)',
            }} />
          );
        })}
      </View>

      {/* Connection lines */}
      {points.map((p, i) => {
        if (i === 0) return null;
        const prev = points[i-1];
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <Animated.View key={i} style={{
            position:'absolute',
            left: prev.x, top: prev.y + 8,
            width: lineAnim.interpolate({ inputRange:[0,1], outputRange:[0, length] }),
            height: 2.5,
            backgroundColor: colors.green,
            borderRadius: 2,
            transform:[{ rotate:`${angle}deg` }],
            transformOrigin:'left center',
          }} />
        );
      })}

      {/* Dots */}
      {points.map((p, i) => (
        <View key={i} style={[styles.dot, { left: p.x - 5, top: p.y + 5 }]} />
      ))}

      {/* X labels */}
      <View style={[styles.xAxis]}>
        {points.map((p, i) => (
          <Text key={i} style={styles.xLabel}>{p.label}</Text>
        ))}
      </View>
    </View>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, valueColor, delay }: {
  label:string; value:string; valueColor:string; delay:number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue:1, duration:400, delay, useNativeDriver:true }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { opacity: anim }]}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Transaction Row ────────────────────────────────────────────────────────────
function TransactionRow({ receipt, slot, duration, amount, phone, index }:
  { receipt:string; slot:string; duration:string; amount:number; phone:string; index:number }) {
  const slideAnim = useRef(new Animated.Value(12)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:300, delay: index*60, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:300, delay: index*60, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.txRow, { opacity: fadeAnim, transform:[{ translateY: slideAnim }] }]}>
      <View style={styles.txIconBox}>
        <Text style={{ fontSize:16, color:colors.green }}>✓</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txReceipt}>{receipt}</Text>
        <Text style={styles.txSub}>{slot} — {duration}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmount}>KES {amount}</Text>
        <Text style={styles.txPhone}>{phone}</Text>
      </View>
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <NavHeader title="Reports & Analytics" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(()=>setRefreshing(false),1000); }} tintColor={colors.green} />
        }
      >
        {/* 4 stat cards */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Revenue"  value="KES 48.8K" valueColor={colors.green} delay={0}   />
          <StatCard label="Total Sessions" value="312"        valueColor={colors.navy}  delay={80}  />
          <StatCard label="Total Users"    value="847"        valueColor={colors.amber} delay={160} />
          <StatCard label="Attendants"     value="6"          valueColor={colors.navy}  delay={240} />
        </View>

        {/* Revenue Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revenue Trend</Text>
          <TrendChart data={WEEKLY_REVENUE} />
        </View>

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.txList}>
          {TRANSACTIONS.map((t, i) => (
            <TransactionRow
              key={t.id}
              receipt={t.receiptCode}
              slot={t.slot}
              duration={t.duration}
              amount={t.amount}
              phone={t.phone}
              index={i}
            />
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, backgroundColor: colors.surface },
  scroll: { padding:16, paddingBottom:48 },

  statsGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:12 },
  statCard: {
    width: (W - 42) / 2,
    backgroundColor:colors.white, borderRadius:16, padding:18, ...shadows.card,
  },
  statValue: { fontSize:scale(22), fontWeight:'800', letterSpacing:-0.5, marginBottom:4 },
  statLabel: { fontSize:scale(12), color:colors.textSecondary },

  card: { backgroundColor:colors.white, borderRadius:20, padding:20, marginBottom:12, ...shadows.card },
  cardTitle: { fontSize:scale(16), fontWeight:'700', color:colors.textPrimary, marginBottom:16 },

  gridLine: { position:'absolute', left:0, right:0, height:1, backgroundColor:colors.border },
  dot: { position:'absolute', width:10, height:10, borderRadius:5, backgroundColor:colors.green, borderWidth:2.5, borderColor:colors.white, zIndex:2 },
  xAxis: { position:'absolute', bottom:0, left:0, right:0, flexDirection:'row', justifyContent:'space-between' },
  xLabel: { fontSize:scale(9), color:colors.textSecondary },

  sectionTitle: { fontSize:scale(16), fontWeight:'700', color:colors.textPrimary, marginBottom:10, marginTop:4 },
  txList: { gap:10 },
  txRow: {
    flexDirection:'row', alignItems:'center',
    backgroundColor:colors.white, borderRadius:16,
    padding:14, ...shadows.card,
  },
  txIconBox: {
    width:40, height:40, borderRadius:12,
    backgroundColor:colors.greenLight,
    alignItems:'center', justifyContent:'center', marginRight:12,
  },
  txInfo: { flex:1 },
  txReceipt: { fontSize:scale(14), fontWeight:'700', color:colors.textPrimary },
  txSub: { fontSize:scale(12), color:colors.textSecondary, marginTop:2 },
  txRight: { alignItems:'flex-end' },
  txAmount: { fontSize:scale(14), fontWeight:'700', color:colors.green },
  txPhone: { fontSize:scale(11), color:colors.textSecondary, marginTop:2 },
});