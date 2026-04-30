import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../constants/theme';
import { BOOKING_HISTORY, BookingRecord } from '../../../constants/data';

function BookingCard({ booking }: { booking: BookingRecord }) {
  const isActive = booking.status === 'active';

  return (
    <View style={[styles.card, { borderTopColor: isActive ? Colors.free : Colors.border }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={styles.pIcon}>
            <Text style={styles.pLetter}>P</Text>
          </View>
          <View>
            <Text style={styles.slotTitle}>Slot {booking.slot} — {booking.zone}</Text>
            <Text style={styles.plateText}>{booking.plate}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E6FAF5' : '#F1F5F9' }]}>
          <Text style={[styles.statusText, { color: isActive ? Colors.free : Colors.textSecondary }]}>
            {isActive ? 'Active' : 'Completed'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{booking.time}</Text>
        </View>
        {booking.amount && (
          <View style={styles.metaItem}>
            <Ionicons name="phone-portrait-outline" size={13} color={Colors.accent} />
            <Text style={[styles.metaText, { color: Colors.accent, fontWeight: '700' }]}>
              KES {booking.amount}
            </Text>
          </View>
        )}
        {booking.receipt && (
          <View style={styles.metaItem}>
            <Ionicons name="receipt-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{booking.receipt}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Booking History</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {BOOKING_HISTORY.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderTopWidth: 3,
    marginBottom: 12,
    padding: 16,
    ...Shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  slotTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  plateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBottom: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});