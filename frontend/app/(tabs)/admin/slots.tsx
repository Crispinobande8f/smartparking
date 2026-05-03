/**
 * ManageSlotsScreen — app/(admin)/slots.tsx
 * Lists all parking lots. Tap a lot → navigates to lot-detail with lotId param.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, StatusBar, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { NavHeader } from '@/components/NavHeader';
import { colors, shadows, scale, W_SCREEN } from '@/constants/theme';
import { PARKING_LOTS, ParkingLot, occupancyPct } from '@/constants/adminData';

// ── Occupancy Bar ─────────────────────────────────────────────────────────────
function OccupancyBar({ pct, color }: { pct: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct / 100, duration: 700, delay: 200, useNativeDriver: false }).start();
  }, []);
  const barWidth = anim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] });
  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, { width: barWidth, backgroundColor: color }]} />
    </View>
  );
}
const barStyles = StyleSheet.create({
  track: { height:6, backgroundColor:colors.border, borderRadius:3, overflow:'hidden' },
  fill:  { height:'100%', borderRadius:3 },
});

// ── Lot Card ──────────────────────────────────────────────────────────────────
function LotCard({ lot, index }: { lot: ParkingLot; index: number }) {
  const slideAnim = useRef(new Animated.Value(16)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:350, delay: index * 80, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:350, delay: index * 80, useNativeDriver:true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(scaleAnim, { toValue:0.97, useNativeDriver:true, speed:50 }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue:1.0,  useNativeDriver:true, speed:50 }).start();

  const pct = occupancyPct(lot);
  const statusColor = lot.status === 'active' ? colors.green : lot.status === 'maintenance' ? colors.amber : colors.red;
  const statusLabel = lot.status === 'active' ? 'Active' : lot.status === 'maintenance' ? 'Maintenance' : 'Inactive';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform:[{ translateY: slideAnim },{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.lotCard, { borderTopColor: lot.color }]}
        onPress={() => router.push({ pathname:'/(tabs)/admin/lot-detail', params:{ lotId: lot.id } })}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        {/* Top row */}
        <View style={styles.lotTopRow}>
          <View style={styles.lotTitleBlock}>
            <Text style={styles.lotName}>{lot.name}</Text>
            <Text style={styles.lotAddress}>{lot.address}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.navy }]}>{lot.totalSlots}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.red }]}>{lot.occupied}</Text>
            <Text style={styles.statLbl}>Occupied</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.green }]}>{lot.available}</Text>
            <Text style={styles.statLbl}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.amber }]}>KES {lot.ratePerHour}/hr</Text>
            <Text style={styles.statLbl}>Rate</Text>
          </View>
        </View>

        {/* Occupancy bar */}
        <View style={styles.occupancyRow}>
          <Text style={styles.occupancyLabel}>Occupancy</Text>
          <Text style={[styles.occupancyPct, { color: lot.color }]}>{pct}%</Text>
        </View>
        <OccupancyBar pct={pct} color={lot.color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ManageSlotsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <NavHeader
        title="Manage Slots"
        rightLabel="+ Add Lot"
        onRightPress={() => {/* TODO: open add lot modal */}}
      />
      <FlatList
        data={PARKING_LOTS}
        keyExtractor={l => l.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(()=>setRefreshing(false),1000); }} tintColor={colors.green} />
        }
        renderItem={({ item, index }) => <LotCard lot={item} index={index} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, backgroundColor: colors.surface },
  list: { padding:16, paddingBottom:40 },
  lotCard: {
    backgroundColor: colors.white,
    borderRadius:20,
    padding:18,
    marginBottom:14,
    borderTopWidth:4,
    ...shadows.card,
  },
  lotTopRow: { flexDirection:'row', alignItems:'flex-start', marginBottom:16 },
  lotTitleBlock: { flex:1 },
  lotName: { fontSize:scale(16), fontWeight:'700', color:colors.textPrimary },
  lotAddress: { fontSize:scale(12), color:colors.textSecondary, marginTop:3 },
  statusPill: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  statusDot: { width:6, height:6, borderRadius:3 },
  statusText: { fontSize:scale(11), fontWeight:'600' },
  statsRow: { flexDirection:'row', alignItems:'center', marginBottom:16 },
  statItem: { flex:1, alignItems:'center' },
  statNum: { fontSize:scale(16), fontWeight:'700', letterSpacing:-0.3 },
  statLbl: { fontSize:scale(11), color:colors.textSecondary, marginTop:2 },
  statDivider: { width:1, height:32, backgroundColor:colors.border },
  occupancyRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  occupancyLabel: { fontSize:scale(12), color:colors.textSecondary, fontWeight:'500' },
  occupancyPct: { fontSize:scale(12), fontWeight:'700' },
});