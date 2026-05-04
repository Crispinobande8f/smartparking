/**
 * CountyManageSlots — app/(county)/manage-slots.tsx
 * Lists all county parking lots. Tap any lot → lot-detail.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, Animated, StatusBar, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { C, shadow, scale } from '@/constants/theme';
import { COUNTY_LOTS, CountyLot, pctNum } from '@/constants/countyData';

// ── Occupancy bar ─────────────────────────────────────────────────────────────
function OccBar({ pct, color }: { pct: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct / 100, duration: 700, delay: 200, useNativeDriver: false }).start();
  }, []);
  return (
    <View style={bar.track}>
      <Animated.View style={[bar.fill, {
        width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        backgroundColor: color,
      }]} />
    </View>
  );
}
const bar = StyleSheet.create({
  track: { height: 7, backgroundColor: '#ECEEF2', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

// ── Lot card ─────────────────────────────────────────────────────────────────
function LotCard({ lot, index }: { lot: CountyLot; index: number }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  const sc    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(sc, { toValue: 1.0,  useNativeDriver: true, speed: 50 }).start();

  const occ = pctNum(lot.occupied, lot.totalSlots);
  const statusColor = lot.status === 'active' ? C.green : C.amber;

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }, { scale: sc }] }}>
      <TouchableOpacity
        style={[styles.card, { borderTopColor: lot.occupancyColor }]}
        onPress={() => router.push({ pathname: '/(tabs)/county/lot-details', params: { lotId: lot.id } })}
        onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}
      >
        {/* Title row */}
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.lotName}>{lot.name}</Text>
            <Text style={styles.lotAddr}>{lot.address}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusTxt, { color: statusColor }]}>
              {lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: C.navy }]}>{lot.totalSlots}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: C.red }]}>{lot.occupied}</Text>
            <Text style={styles.statLbl}>Occupied</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: C.green }]}>{lot.available}</Text>
            <Text style={styles.statLbl}>Available</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: C.amber }]}>KES {lot.ratePerHour}/hr</Text>
            <Text style={styles.statLbl}>Rate</Text>
          </View>
        </View>

        {/* Occupancy */}
        <View style={styles.occRow}>
          <Text style={styles.occLabel}>Occupancy</Text>
          <Text style={[styles.occPct, { color: lot.occupancyColor }]}>{occ}%</Text>
        </View>
        <OccBar pct={occ} color={lot.occupancyColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CountyManageSlots() {
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <SafeAreaView style={{ backgroundColor: C.navy }}>
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Slots</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnTxt}>+ Add Lot</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      <FlatList
        data={COUNTY_LOTS}
        keyExtractor={l => l.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }}
            tintColor={C.green} />
        }
        renderItem={({ item, index }) => <LotCard lot={item} index={index} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.surface },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.navy,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: C.white, fontWeight: '300', lineHeight: 30 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: scale(17), fontWeight: '700', color: C.white },
  addBtn: {
    backgroundColor: C.green, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnTxt: { fontSize: scale(12), fontWeight: '700', color: C.white },
  list: { padding: 16, paddingBottom: 48 },
  card: {
    backgroundColor: C.white, borderRadius: 20, padding: 18,
    marginBottom: 14, borderTopWidth: 4, ...shadow,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  titleBlock: { flex: 1 },
  lotName: { fontSize: scale(16), fontWeight: '700', color: C.textPrimary },
  lotAddr: { fontSize: scale(12), color: C.textSecondary, marginTop: 3 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: scale(11), fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: scale(16), fontWeight: '700', letterSpacing: -0.3 },
  statLbl: { fontSize: scale(10), color: C.textSecondary, marginTop: 2 },
  statDiv: { width: 1, height: 32, backgroundColor: C.border },
  occRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  occLabel: { fontSize: scale(12), color: C.textSecondary, fontWeight: '500' },
  occPct: { fontSize: scale(12), fontWeight: '700' },
});