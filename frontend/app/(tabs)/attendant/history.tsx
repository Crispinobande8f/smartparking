/**
 * BookingHistoryScreen.tsx
 * Screen: Attendant booking history — list of all sessions with status
 * Route: app/(attendant)/history.tsx
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { MOCK_HISTORY, BookingHistoryItem, formatTime } from '@/constants/mockData';
import { colors, shadows, scale } from '@/constants/theme';

// ─── Status pill config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: { bg: colors.greenLight, text: colors.green, label: 'Active' },
  completed: { bg: '#F0F1F3', text: '#6B7280', label: 'Completed' },
  cancelled: { bg: '#FEF2F2', text: colors.red, label: 'Cancelled' },
};

// ─── History Row ─────────────────────────────────────────────────────────────

function HistoryRow({
  item,
  index,
}: {
  item: BookingHistoryItem;
  index: number;
}) {
  const slideAnim = useRef(new Animated.Value(16)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const config = STATUS_CONFIG[item.status];
  const isCompleted = item.status === 'completed';

  return (
    <Animated.View
      style={[
        styles.row,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        isCompleted && styles.rowCompleted,
      ]}
    >
      {/* Left accent bar */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: config.text },
        ]}
      />

      <View style={styles.rowInner}>
        {/* Top row: icon + slot/plate + status pill */}
        <View style={styles.topRow}>
          <View style={styles.slotIconWrap}>
            <Text style={styles.slotIconText}>P</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.slotTitle}>
              Slot {item.slot} — {item.zone}
            </Text>
            <Text style={styles.plateText}>{item.plate}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusText, { color: config.text }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Bottom row: time + optional amount + receipt */}
        <View style={styles.bottomRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaIcon}>🕐</Text>
            <Text style={styles.metaText}>{formatTime(item.startTime)}</Text>
          </View>
          {isCompleted && item.amount !== undefined && (
            <View style={styles.metaChip}>
              <Text style={styles.metaIcon}>📱</Text>
              <Text style={[styles.metaText, styles.amountText]}>
                KES {item.amount}
              </Text>
            </View>
          )}
          {isCompleted && item.receiptCode && (
            <View style={styles.metaChip}>
              <Text style={styles.metaIcon}>📋</Text>
              <Text style={styles.metaText}>{item.receiptCode}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function BookingHistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [history, setHistory] = useState(MOCK_HISTORY);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: re-fetch from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filtered =
    filter === 'all'
      ? history
      : history.filter((h) => h.status === filter);

  const FILTERS: Array<{ key: 'all' | 'active' | 'completed'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Navy Header */}
      <SafeAreaView style={styles.headerSafe}>
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking History</Text>
          <View style={{ width: 40 }} />
        </Animated.View>
      </SafeAreaView>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              filter === f.key && styles.filterTabActive,
            ]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f.key && styles.filterTabTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.green}
          />
        }
        renderItem={({ item, index }) => (
          <HistoryRow item={item} index={index} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },

  // Header
  headerSafe: { backgroundColor: colors.navy },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.navy,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: colors.white, fontWeight: '300', lineHeight: 30 },
  headerTitle: {
    fontSize: scale(17),
    fontWeight: '700',
    color: colors.white,
  },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  filterTabActive: { backgroundColor: colors.navy },
  filterTabText: {
    fontSize: scale(13),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: { color: colors.white },

  // List
  list: { padding: 16, paddingBottom: 40 },

  // Row
  row: {
    backgroundColor: colors.white,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.card,
  },
  rowCompleted: { opacity: 0.85 },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  rowInner: {
    flex: 1,
    padding: 16,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  slotIconText: {
    fontSize: scale(16),
    fontWeight: '800',
    color: colors.green,
  },
  titleBlock: { flex: 1 },
  slotTitle: {
    fontSize: scale(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  plateText: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: scale(12),
    fontWeight: '600',
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaIcon: { fontSize: 12 },
  metaText: {
    fontSize: scale(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  amountText: { color: colors.green, fontWeight: '700' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: scale(15), color: colors.textSecondary },
});