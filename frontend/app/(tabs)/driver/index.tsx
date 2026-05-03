import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  //FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../constants/theme';
import { PARKING_SLOTS, ParkingSlot } from '../../../constants/data';
import SlotCard from '../../../components/SlotCard';
import BookingSheet,{SlotInfo} from '../../../components/BookingSheet';

const ZONES = ['All Zones', 'Zone A', 'Zone B', 'Zone C', 'Zone D'];

export default function DriverHome() {
  const router = useRouter();
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  //const [modalVisible, setModalVisible] = useState(false);

  const filteredSlots = useMemo(() => {
    if (selectedZone === 'All Zones') return PARKING_SLOTS;
    const zone = selectedZone.replace('Zone ', '');
    return PARKING_SLOTS.filter((s) => s.zone === zone);
  }, [selectedZone]);

  const stats = useMemo(() => {
    const available = PARKING_SLOTS.filter((s) => s.status === 'free').length;
    const occupied = PARKING_SLOTS.filter((s) => s.status === 'taken').length;
    const reserved = PARKING_SLOTS.filter((s) => s.status === 'reserved').length;
    return { available, occupied, reserved, total: PARKING_SLOTS.length };
  }, []);

  const handleSlotPress = (slot: ParkingSlot) => {
    setSelectedSlot({
        id: slot.id,
        number:      slot.id,                              
        zone:        slot.zone,
        ratePerHour: 100,                              
     });
    };

  //const handleConfirm = (slot: ParkingSlot, hours: number) => {
    //setModalVisible(false);
    // Navigate to history or show success
  //};

  // Chunk slots into rows of 3
  const rows: ParkingSlot[][] = [];
  for (let i = 0; i < filteredSlots.length; i += 3) {
    rows.push(filteredSlots.slice(i, i + 3));
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.avatarBtn}>
            <Ionicons name="person-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.greeting}>
            <Text style={styles.greetText}>Hello, James 👋</Text>
            <Text style={styles.greetSub}>Find your perfect spot</Text>
          </View>
          <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/driver/history' as any)}>
                <Ionicons name="time-outline" size={18} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/driver/session' as any)}> 
                <Ionicons name="car-outline" size={18} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)')}>
                <Ionicons name="exit-outline" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
        </View>

        {/* Location Bar */}
        <View style={styles.locationBar}>
          <Ionicons name="location" size={14} color={Colors.accent} />
          <Text style={styles.locationText}>Nairobi CBD Parking — Kenyatta Ave</Text>
          <Text style={styles.rateText}>KES 100/hr</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: Colors.free }]}>{stats.available}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: Colors.taken }]}>{stats.occupied}</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: Colors.reserved }]}>{stats.reserved}</Text>
            <Text style={styles.statLabel}>Reserved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: Colors.textPrimary }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Zone Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.zoneScroll}
        >
          {ZONES.map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[styles.zoneBtn, selectedZone === zone && styles.zoneBtnActive]}
              onPress={() => setSelectedZone(zone)}
            >
              <Text style={[styles.zoneBtnText, selectedZone === zone && styles.zoneBtnTextActive]}>
                {zone}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Slot Grid */}
        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.gridRow}>
              {row.map((slot) => (
                <SlotCard key={slot.id} slot={slot} onPress={handleSlotPress} />
              ))}
              {/* Fill empty cells */}
              {row.length < 3 && Array(3 - row.length).fill(null).map((_, i) => (
                <View key={`empty-${i}`} style={{ flex: 1, margin: 5 }} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <BookingSheet
        visible={!!selectedSlot}
        slot={selectedSlot ?? { id: 0, number: 'A1', zone: 'A', ratePerHour: 100 }}
        userPhone="0712345678"
        onClose={() => setSelectedSlot(null)}
        onConfirmed={(ref) => {
            setSelectedSlot(null);
            console.log('Booked:', ref);
        }}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  greeting: {
    flex: 1,
  },
  greetText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  greetSub: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.white,
    fontWeight: '500',
  },
  rateText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    padding: 12,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    ...Shadow.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  zoneScroll: {
    paddingBottom: 12,
    gap: 8,
  },
  zoneBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  zoneBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  zoneBtnTextActive: {
    color: Colors.white,
  },
  grid: {
    gap: 0,
  },
  gridRow: {
    flexDirection: 'row',
  },
});