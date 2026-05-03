/**
 * AdminDashboard — app/(admin)/index.tsx
 * Shows: stats grid, weekly bar chart, quick actions, recent sessions
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Animated, StatusBar, RefreshControl, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, scale, W_SCREEN } from '@/constants/theme';
import { PARKING_LOTS, WEEKLY_REVENUE } from '@/constants/adminData';
import { MOCK_ACTIVE_SESSIONS } from '@/constants/mockData';

const BAR_MAX = Math.max(...WEEKLY_REVENUE.map(r => r.value));
const BAR_HEIGHT = 100;

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, valueColor = colors.textPrimary, delay = 0 }:
  { icon:string; value:string; label:string; valueColor?:string; delay?:number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue:1, duration:400, delay, useNativeDriver:true }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { opacity: anim }]}>
      <View style={styles.statIconBox}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Bar Chart ────────────────────────────────────────────────────────────────
function WeeklyBarChart() {
  const anims = WEEKLY_REVENUE.map(() => useRef(new Animated.Value(0)).current);
  useEffect(() => {
    Animated.stagger(60, anims.map((a, i) =>
      Animated.timing(a, { toValue: WEEKLY_REVENUE[i].value / BAR_MAX, duration: 500, delay: 200, useNativeDriver: false })
    )).start();
  }, []);
  return (
    <View style={styles.chart}>
      <View style={styles.barsRow}>
        {WEEKLY_REVENUE.map((r, i) => (
          <View key={i} style={styles.barCol}>
            <Animated.View style={[
              styles.bar,
              {
                height: anims[i].interpolate({ inputRange:[0,1], outputRange:[0, BAR_HEIGHT] }),
                backgroundColor: i === WEEKLY_REVENUE.length - 1 ? colors.green : colors.navy,
              }
            ]} />
            <Text style={styles.barLabel}>{r.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ icon, label, color, onPress }:
  { icon:string; label:string; color:string; onPress:()=>void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickIconBox, { backgroundColor: color + '22' }]}>
        <Text style={styles.quickIcon}>{icon}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Session Row ───────────────────────────────────────────────────────────────
function SessionRow({ plate, slot, driver, status }: 
  { plate:string; slot:string; driver:string; status:'active'|'completed' }) {
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionIconBox}>
        <Text style={{ fontSize: 18 }}>🚗</Text>
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionPlate}>{plate}</Text>
        <Text style={styles.sessionSub}>{slot} · {driver}</Text>
      </View>
      <View style={[styles.pill, { backgroundColor: status === 'active' ? colors.greenLight : colors.surface }]}>
        <Text style={[styles.pillText, { color: status === 'active' ? colors.green : colors.textMuted }]}>
          {status === 'active' ? 'Active' : 'Done'}
        </Text>
      </View>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue:1, duration:500, useNativeDriver:true }).start();
  }, []);

  const totalSlots = PARKING_LOTS.reduce((s, l) => s + l.totalSlots, 0);
  const totalOccupied = PARKING_LOTS.reduce((s, l) => s + l.occupied, 0);
  const occupancy = Math.round((totalOccupied / totalSlots) * 100);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>D</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Admin Panel</Text>
                <Text style={styles.headerSub}>David Mwangi</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/admin/revenue')}>
                <Text style={{ fontSize: 18 }}>📊</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.replace('/(tabs)')}>
                <Text style={{ fontSize: 18 }}>⇥</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(()=>setRefreshing(false),1000); }} tintColor={colors.green} />}
      >
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="💵" value="KES 3,200" label="Today's Revenue" valueColor={colors.green} delay={0} />
          <StatCard icon="💼" value="KES 48.8K"  label="Total Revenue"   delay={80} />
          <StatCard icon="🚗" value={String(totalOccupied)} label="Active Sessions" valueColor={colors.amber} delay={160} />
          <StatCard icon="🅿️" value={`${occupancy}%`} label="Occupancy" delay={240} />
        </View>

        {/* Weekly Revenue Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Revenue</Text>
          <Text style={styles.cardSub}>Last 7 days</Text>
          <WeeklyBarChart />
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.quickRow}>
            <QuickAction icon="🅿️" label="Manage Slots" color={colors.green}
              onPress={() => router.push('/(tabs)/admin/slots')} />
            <QuickAction icon="👥" label="Manage Users" color={colors.navy}
              onPress={() => router.push('/(tabs)/admin/users')} />
            <QuickAction icon="📊" label="Reports" color={colors.amber}
              onPress={() => router.push('/(tabs)/admin/reports')} />
          </View>
        </View>

        {/* Recent Sessions */}
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        <View style={styles.card}>
          <SessionRow plate="KBZ 412G" slot="Slot A2" driver="James Kamau" status="active" />
          <View style={styles.divider} />
          <SessionRow plate="KCG 230A" slot="Slot B1" driver="Grace Wanjiku" status="active" />
          <View style={styles.divider} />
          <SessionRow plate="KDA 554T" slot="Slot A5" driver="Peter Otieno" status="completed" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.navy, paddingHorizontal:20, paddingBottom:20, paddingTop:8 },
  headerRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  headerLeft: { flexDirection:'row', alignItems:'center', gap:12 },
  avatarBox: { width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' },
  avatarText: { fontSize:scale(18), fontWeight:'700', color:colors.white },
  headerTitle: { fontSize:scale(17), fontWeight:'700', color:colors.white },
  headerSub: { fontSize:scale(12), color:colors.green, marginTop:2 },
  headerActions: { flexDirection:'row', gap:8 },
  iconBtn: { width:40, height:40, borderRadius:10, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  scroll: { padding:16, paddingBottom:40 },
  statsGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:12 },
  statCard: { width:(W_SCREEN - 42) / 2, backgroundColor:colors.white, borderRadius:16, padding:16, ...shadows.card },
  statIconBox: { width:40, height:40, borderRadius:12, backgroundColor:colors.surface, alignItems:'center', justifyContent:'center', marginBottom:10 },
  statIcon: { fontSize:18 },
  statValue: { fontSize:scale(20), fontWeight:'700', letterSpacing:-0.5, marginBottom:2 },
  statLabel: { fontSize:scale(12), color:colors.textSecondary },
  card: { backgroundColor:colors.white, borderRadius:20, padding:18, marginBottom:12, ...shadows.card },
  cardTitle: { fontSize:scale(16), fontWeight:'700', color:colors.textPrimary, marginBottom:2 },
  cardSub: { fontSize:scale(12), color:colors.textSecondary, marginBottom:16 },
  chart: { overflow:'hidden' },
  barsRow: { flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', height: BAR_HEIGHT + 24 },
  barCol: { flex:1, alignItems:'center', justifyContent:'flex-end' },
  bar: { width:'65%', borderRadius:6, marginBottom:6 },
  barLabel: { fontSize:scale(11), color:colors.textSecondary },
  quickRow: { flexDirection:'row', justifyContent:'space-around' },
  quickAction: { alignItems:'center', gap:8 },
  quickIconBox: { width:56, height:56, borderRadius:18, alignItems:'center', justifyContent:'center' },
  quickIcon: { fontSize:24 },
  quickLabel: { fontSize:scale(12), fontWeight:'600', color:colors.textPrimary },
  sectionTitle: { fontSize:scale(16), fontWeight:'700', color:colors.textPrimary, marginBottom:10, marginTop:4 },
  sessionRow: { flexDirection:'row', alignItems:'center' },
  sessionIconBox: { width:40, height:40, borderRadius:12, backgroundColor:colors.greenLight, alignItems:'center', justifyContent:'center', marginRight:12 },
  sessionInfo: { flex:1 },
  sessionPlate: { fontSize:scale(14), fontWeight:'700', color:colors.textPrimary },
  sessionSub: { fontSize:scale(12), color:colors.textSecondary, marginTop:2 },
  pill: { paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  pillText: { fontSize:scale(11), fontWeight:'600' },
  divider: { height:1, backgroundColor:colors.border, marginVertical:12 },
});