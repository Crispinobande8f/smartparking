/**
 * LotDetailScreen — app/(admin)/lot-detail.tsx
 * Shows individual slots grid for a parking lot. Navigated from ManageSlotsScreen.
 * Receives: lotId param via router
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, StatusBar, ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, shadows, scale, W_SCREEN } from '@/constants/theme';
import { PARKING_LOTS, LOT_SLOTS, ParkingSlotItem } from '@/constants/adminData';

const SLOT_SIZE = (W_SCREEN - 48) / 4; // 4 columns

const STATUS_CONFIG = {
  available:   { bg:'#E8FBF5', border:'#00C48C', text:'#00C48C', icon:'' },
  occupied:    { bg:'#FDEAEA', border:'#E84040', text:'#E84040', icon:'🚗' },
  reserved:    { bg:'#FEF6E7', border:'#F5A623', text:'#F5A623', icon:'🔒' },
  maintenance: { bg:'#F0F1F3', border:'#B0B7C3', text:'#B0B7C3', icon:'🔧' },
};

// ── Slot Cell ─────────────────────────────────────────────────────────────────
function SlotCell({ slot, index }: { slot: ParkingSlotItem; index: number }) {
  const config = STATUS_CONFIG[slot.status];
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:1, duration:300, delay: Math.min(index * 30, 600), useNativeDriver:true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.slotCell, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[styles.slot, { backgroundColor: config.bg, borderColor: config.border }]}
        activeOpacity={0.75}
      >
        {config.icon ? <Text style={styles.slotIcon}>{config.icon}</Text> : null}
        <Text style={[styles.slotCode, { color: config.text }]}>{slot.slotCode}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Legend Item ────────────────────────────────────────────────────────────────
function LegendItem({ color, label }: { color:string; label:string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LotDetailScreen() {
  const { lotId } = useLocalSearchParams<{ lotId: string }>();
  const [activeZone, setActiveZone] = useState<string>('All');

  const lot = PARKING_LOTS.find(l => l.id === lotId);
  const allSlots = LOT_SLOTS[lotId ?? ''] ?? [];
  const zones = ['All', ...Array.from(new Set(allSlots.map(s => s.zone)))];
  const filtered = activeZone === 'All' ? allSlots : allSlots.filter(s => s.zone === activeZone);

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
  }, []);

  if (!lot) return null;

  const available   = allSlots.filter(s => s.status === 'available').length;
  const occupied    = allSlots.filter(s => s.status === 'occupied').length;
  const reserved    = allSlots.filter(s => s.status === 'reserved').length;
  const maintenance = allSlots.filter(s => s.status === 'maintenance').length;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
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

        {/* Summary pills */}
        <View style={styles.summaryRow}>
          {[
            { label:`${available} Free`,  color: colors.green },
            { label:`${occupied} Busy`,   color: colors.red   },
            { label:`${reserved} Resv.`,  color: colors.amber },
            { label:`${maintenance} Maint.`, color:'#B0B7C3'  },
          ].map((item, i) => (
            <View key={i} style={[styles.summaryPill, { backgroundColor: item.color + '25' }]}>
              <Text style={[styles.summaryText, { color: item.color }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Zone filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneTabs} contentContainerStyle={{ paddingHorizontal:16, gap:8 }}>
          {zones.map(z => (
            <TouchableOpacity
              key={z}
              style={[styles.zoneTab, activeZone === z && styles.zoneTabActive]}
              onPress={() => setActiveZone(z)}
              activeOpacity={0.75}
            >
              <Text style={[styles.zoneTabText, activeZone === z && styles.zoneTabTextActive]}>{z}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <LegendItem color={colors.green} label="Available" />
          <LegendItem color={colors.red}   label="Occupied"  />
          <LegendItem color={colors.amber} label="Reserved"  />
          <LegendItem color="#B0B7C3"      label="Maint."    />
        </View>

        {/* Slots grid */}
        <View style={styles.grid}>
          {filtered.map((slot, i) => (
            <SlotCell key={slot.id} slot={slot} index={i} />
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.navy, paddingBottom:16, paddingTop:8 },
  headerRow: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingBottom:12 },
  backBtn: { width:40, height:40, borderRadius:12, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  backIcon: { fontSize:26, color:colors.white, fontWeight:'300', lineHeight:30 },
  headerCenter: { flex:1, alignItems:'center' },
  headerTitle: { fontSize:scale(16), fontWeight:'700', color:colors.white },
  headerSub: { fontSize:scale(11), color:'rgba(255,255,255,0.6)', marginTop:2 },
  summaryRow: { flexDirection:'row', justifyContent:'center', gap:8, paddingHorizontal:16 },
  summaryPill: { paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  summaryText: { fontSize:scale(11), fontWeight:'600' },
  zoneTabs: { paddingVertical:14 },
  zoneTab: { paddingHorizontal:16, paddingVertical:8, borderRadius:20, backgroundColor:colors.white, borderWidth:1, borderColor:colors.border },
  zoneTabActive: { backgroundColor:colors.navy, borderColor:colors.navy },
  zoneTabText: { fontSize:scale(13), fontWeight:'600', color:colors.textSecondary },
  zoneTabTextActive: { color:colors.white },
  legend: { flexDirection:'row', gap:16, paddingHorizontal:16, marginBottom:12 },
  legendItem: { flexDirection:'row', alignItems:'center', gap:5 },
  legendDot: { width:8, height:8, borderRadius:4 },
  legendText: { fontSize:scale(11), color:colors.textSecondary },
  grid: { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:12 },
  slotCell: { width: SLOT_SIZE, padding:4 },
  slot: {
    height: SLOT_SIZE * 0.9,
    borderRadius:10,
    borderWidth:1.5,
    alignItems:'center',
    justifyContent:'center',
    gap:2,
  },
  slotIcon: { fontSize:14 },
  slotCode: { fontSize:scale(11), fontWeight:'700' },
});