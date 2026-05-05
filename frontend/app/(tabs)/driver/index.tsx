import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  //FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../constants/theme';
import { PARKING_SLOTS, ParkingSlot } from '../../../constants/data';
import SlotCard from '../../../components/SlotCard';
import BookingSheet,{SlotInfo} from '../../../components/BookingSheet';
import { apiFetch } from '@/constants/api';

const ZONES = ['All Zones', 'Zone A', 'Zone B', 'Zone C', 'Zone D'];

export default function DriverHome() {
  const router = useRouter();
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  //const [modalVisible, setModalVisible] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  

  const ParkingSlots = async ()=>{
    try{
      setLoading(true);
      const data = await apiFetch('/slots');

      const mappedData = data.map((item: any) => {

        const zoneLetter = item.slot_number.charAt(0).toUpperCase();
        const numberOnly = parseInt(item.slot_number.substring(1));

        return {
          ...item,
          id: item.id.toString(),
          zone: zoneLetter,              
          number: numberOnly,            
          status: item.status === 'available' ? 'free' : 
                  item.status === 'occupied' ? 'taken' : 
                  item.status === 'reserved' ? 'reserved' : 'maintenance',
        };
      });
      setSlots(mappedData);
      
    }catch(error:any){
      console.error("Fetch error:", error);
      Alert.alert("Network Error", "Check your connection to the server");
    }finally{
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      ParkingSlots();
    }, [])
  );
  const filteredSlots = useMemo(() => {
    if (selectedZone === 'All Zones') return slots;
    const zoneLetter = selectedZone.replace('Zone ', '');
    return slots.filter((s) => s.zone === zoneLetter);
  }, [selectedZone, slots]);

  const stats = useMemo(() => {
    const available = slots.filter((s) => s.status === 'free').length;
    const occupied = slots.filter((s) => s.status === 'taken').length;
    const reserved = slots.filter((s) => s.status === 'reserved').length;
    return { available, occupied, reserved, total: slots.length };
  }, [slots]);

  const handleSlotPress = (slot: any) => {
    setSelectedSlot({
      id: slot.id,
      number: slot.slot_number,
      zone: slot.zone,
      ratePerHour: slot.hourly_rate || 100,
    });
  };

  const handleCheckoutConfirmed = useCallback((slotId: string) => {
      setSlots(prev =>
        prev.map(s => s.id === slotId ? { ...s, status: 'leaving' } : s)
      );

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 12) { clearInterval(poll); return; } 

        try {
          const data = await apiFetch('/slots');
          const updated = data.find((s: any) => s.id.toString() === slotId);
          if (updated?.status === 'available') {
            clearInterval(poll);
            ParkingSlots(); 
          }
        } catch { clearInterval(poll); }
      }, 5000);
    }, []);

  const rows = [];
  for (let i = 0; i < filteredSlots.length; i += 3) {
    rows.push(filteredSlots.slice(i, i + 3));
  }

  if (loading && slots.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Loading slots...</Text>
      </View>
    );
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
        {/* Stats Card uses calculated stats */}
        <View style={styles.statsCard}>
           {/* ... stat items ... */}
        </View>

        {/* Zone Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneScroll}>
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
                <SlotCard key={slot.id} slot={slot} onPress={() => handleSlotPress(slot)} />
              ))}
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
        userPhone=""
        onClose={() => setSelectedSlot(null)}
        onConfirmed={(ref, slotId) => {
          if(slotId) handleCheckoutConfirmed(slotId);
          else ParkingSlots(); 
        }}
        onSlotRefresh={ParkingSlots}
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