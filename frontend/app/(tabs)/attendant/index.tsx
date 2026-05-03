/**
 * AttendantDashboard.tsx
 * Screen: Attendant home — shows stats, check-in/out buttons, active sessions list
 * Route: app/(attendant)/index.tsx
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import {
  MOCK_ACTIVE_SESSIONS,
  ActiveSession,
  getElapsed,
  getAmount,
} from '@/constants/mockData';
import { colors, shadows, scale } from '@/constants/theme';

// ─── Sub-components ────────────────────────────────────────────────────────

/** Top stat card (Active / Today / Revenue) */
function StatCard({
  icon,
  value,
  label,
  valueColor = colors.textPrimary,
  delay = 0,
}: {
  icon: string;
  value: string;
  label: string;
  valueColor?: string;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { opacity: anim }]}>
      <View style={styles.statIconWrap}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

/** Single active session row */
function SessionRow({
  session,
  index,
}: {
  session: ActiveSession;
  index: number;
}) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [elapsed, setElapsed] = useState(getElapsed(session.startTime));
  const [amount, setAmount] = useState(getAmount(session.startTime, session.ratePerHour));

  // Staggered entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: 300 + index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: 300 + index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Live timer updates every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsed(session.startTime));
      setAmount(getAmount(session.startTime, session.ratePerHour));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View
      style={[
        styles.sessionRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.sessionIconWrap}>
        <Text style={styles.sessionIcon}>🚗</Text>
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionPlate}>{session.plate}</Text>
        <Text style={styles.sessionSub}>
          Slot {session.slot} · {session.driverName}
        </Text>
      </View>
      <View style={styles.sessionRight}>
        <Text style={styles.sessionElapsed}>{elapsed}</Text>
        <Text style={styles.sessionAmount}>KES {amount}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function AttendantDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState(MOCK_ACTIVE_SESSIONS);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: re-fetch sessions from API
    setTimeout(() => setRefreshing(false), 1200);
  };

  const totalRevenue = sessions.reduce(
    (sum, s) => sum + getAmount(s.startTime, s.ratePerHour),
    0
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* ── Navy Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>G</Text>
              </View>
              <View>
                <Text style={styles.headerGreeting}>Hello, Grace</Text>
                <Text style={styles.headerRole}>Parking Attendant · CBD Lot A</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.75}
            >
              <Text style={styles.logoutIcon}>⇥</Text>
            </TouchableOpacity>
          </View>

          {/* ── Stat Cards ── */}
          <View style={styles.statsRow}>
            <StatCard icon="🚗" value={String(sessions.length)} label="Active" delay={100} />
            <StatCard icon="📅" value="5" label="Today" delay={180} />
            <StatCard
              icon="💵"
              value={`KES ${(totalRevenue / 1000).toFixed(1)}K`}
              label="Revenue"
              valueColor={colors.amber}
              delay={260}
            />
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ── White Body Sheet ── */}
      <View style={styles.body}>
        {/* Check In / Check Out buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnGreen]}
            onPress={() => router.push('/(tabs)/attendant/checkin')}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>→|</Text>
            <Text style={styles.actionLabel}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnNavy]}
            onPress={() => router.push('/(tabs)/attendant/checkout')}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>|→</Text>
            <Text style={styles.actionLabel}>Check Out</Text>
          </TouchableOpacity>
        </View>

        {/* Active Sessions */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.green}
            />
          }
        >
          <Text style={styles.sectionTitle}>Active Sessions</Text>

          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🅿️</Text>
              <Text style={styles.emptyText}>No active sessions</Text>
            </View>
          ) : (
            sessions.map((s, i) => (
              <SessionRow key={s.id} session={s} index={i} />
            ))
          )}
        </ScrollView>

        {/* FAB - New Check In */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/attendant/checkin')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
          <Text style={styles.fabLabel}>New Check-In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },

  // Header
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: scale(18),
    fontWeight: '700',
    color: colors.white,
  },
  headerGreeting: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.white,
  },
  headerRole: {
    fontSize: scale(12),
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: { fontSize: 20, color: colors.white },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    ...shadows.card,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIcon: { fontSize: 18 },
  statValue: {
    fontSize: scale(20),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Body
  body: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    ...shadows.card,
  },
  actionBtnGreen: { backgroundColor: colors.green },
  actionBtnNavy: { backgroundColor: colors.navy },
  actionIcon: { fontSize: 18, color: colors.white, fontWeight: '700' },
  actionLabel: {
    fontSize: scale(15),
    fontWeight: '700',
    color: colors.white,
  },

  // Sessions list
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
    marginTop: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    ...shadows.card,
  },
  sessionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionIcon: { fontSize: 18 },
  sessionInfo: { flex: 1 },
  sessionPlate: {
    fontSize: scale(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sessionSub: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginTop: 3,
  },
  sessionRight: { alignItems: 'flex-end' },
  sessionElapsed: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sessionAmount: {
    fontSize: scale(13),
    color: colors.green,
    fontWeight: '600',
    marginTop: 2,
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: scale(15),
    color: colors.textSecondary,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    ...shadows.strong,
  },
  fabIcon: {
    fontSize: 20,
    color: colors.white,
    fontWeight: '700',
  },
  fabLabel: {
    fontSize: scale(14),
    fontWeight: '700',
    color: colors.white,
  },
});