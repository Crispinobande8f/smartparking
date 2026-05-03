/**
 * SessionDetails.tsx
 * Screen: Driver — current parking session details
 * Route: app/(driver)/session.tsx  (or wherever you place it)
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
} from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, scale } from '@/constants/theme';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SessionData {
  driverName: string;
  phone: string;
  plate: string;
  vehicle: string;
  color: string;
  slot: string;
  lot: string;
  checkInTime: Date;
  depositPaid: number;
  ratePerHour: number;
}

// ─── Mock Session (replace with real data / route params) ───────────────────

const MOCK_SESSION: SessionData = {
  driverName: 'James Mwangi',
  phone: '+254 712 345 678',
  plate: 'KDA 123A',
  vehicle: 'Toyota Fielder',
  color: 'Silver',
  slot: 'A-14',
  lot: 'CBD Lot A',
  checkInTime: new Date(Date.now() - 1000 * 60 * 97), // 1hr 37min ago
  depositPaid: 200,
  ratePerHour: 100,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getElapsedParts(start: Date): { hours: number; minutes: number; total: number } {
  const diffMs = Date.now() - start.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    total: totalMinutes,
  };
}

function getAmountOwed(start: Date, ratePerHour: number, deposit: number): number {
  const { total } = getElapsedParts(start);
  const accrued = (total / 60) * ratePerHour;
  return Math.max(0, Math.round(accrued - deposit));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  valueStyle,
  delay = 0,
}: {
  icon: string;
  label: string;
  value: string;
  valueStyle?: object;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.detailRow,
        { opacity: anim, transform: [{ translateY: slide }] },
      ]}
    >
      <View style={styles.detailIconWrap}>
        <Text style={styles.detailIcon}>{icon}</Text>
      </View>
      <View style={styles.detailTexts}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
      </View>
    </Animated.View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ─── Live Timer Widget ────────────────────────────────────────────────────────

function LiveTimer({ checkInTime }: { checkInTime: Date }) {
  const [elapsed, setElapsed] = useState(getElapsedParts(checkInTime));
  const pulse = useRef(new Animated.Value(1)).current;

  // Update every second
  useEffect(() => {
    const id = setInterval(() => setElapsed(getElapsedParts(checkInTime)), 1000);
    return () => clearInterval(id);
  }, []);

  // Pulsing dot
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.timerCard}>
      <View style={styles.timerLiveRow}>
        <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
        <Text style={styles.liveText}>LIVE SESSION</Text>
      </View>
      <View style={styles.timerDisplay}>
        <View style={styles.timerUnit}>
          <Text style={styles.timerDigit}>{String(elapsed.hours).padStart(2, '0')}</Text>
          <Text style={styles.timerUnitLabel}>HRS</Text>
        </View>
        <Text style={styles.timerColon}>:</Text>
        <View style={styles.timerUnit}>
          <Text style={styles.timerDigit}>{String(elapsed.minutes).padStart(2, '0')}</Text>
          <Text style={styles.timerUnitLabel}>MIN</Text>
        </View>
      </View>
      <Text style={styles.timerSub}>
        Since {formatTime(checkInTime)} · {formatDate(checkInTime)}
      </Text>
    </View>
  );
}

// ─── Amount Summary Card ──────────────────────────────────────────────────────

function AmountCard({ session }: { session: SessionData }) {
  const [owed, setOwed] = useState(
    getAmountOwed(session.checkInTime, session.ratePerHour, session.depositPaid)
  );
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setOwed(getAmountOwed(session.checkInTime, session.ratePerHour, session.depositPaid));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const elapsed = getElapsedParts(session.checkInTime);
  const accrued = Math.round(((elapsed.total / 60) * session.ratePerHour));

  return (
    <Animated.View
      style={[
        styles.amountCard,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Accent strip */}
      <View style={styles.amountAccent} />

      <Text style={styles.amountTitle}>Amount Summary</Text>

      <View style={styles.amountRows}>
        <View style={styles.amountRow}>
          <Text style={styles.amountRowLabel}>Accrued charges</Text>
          <Text style={styles.amountRowValue}>KES {accrued}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountRowLabel}>Deposit paid</Text>
          <Text style={[styles.amountRowValue, { color: colors.green }]}>
            − KES {session.depositPaid}
          </Text>
        </View>
        <View style={styles.amountDivider} />
        <View style={styles.amountRow}>
          <Text style={styles.amountOwedLabel}>Balance due</Text>
          <Text style={[styles.amountOwedValue, owed > 0 && styles.amountOwedPositive]}>
            KES {owed}
          </Text>
        </View>
      </View>

      <View style={styles.rateChip}>
        <Text style={styles.rateChipText}>Rate: KES {session.ratePerHour}/hr</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SessionDetails() {
  const session = MOCK_SESSION; // TODO: replace with useLocalSearchParams or context
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* ── Navy Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.75}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>My Session</Text>
              <View style={styles.headerSlotChip}>
                <Text style={styles.headerSlotText}>Slot {session.slot}</Text>
              </View>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Timer */}
        <LiveTimer checkInTime={session.checkInTime} />

        {/* Amount Summary */}
        <AmountCard session={session} />

        {/* Driver Details */}
        <SectionHeader title="Driver" />
        <View style={styles.card}>
          <DetailRow icon="👤" label="Full Name" value={session.driverName} delay={100} />
          <DetailRow icon="📞" label="Phone" value={session.phone} delay={160} />
        </View>

        {/* Vehicle Details */}
        <SectionHeader title="Vehicle" />
        <View style={styles.card}>
          <DetailRow icon="🔖" label="Number Plate" value={session.plate} delay={220} />
          <DetailRow icon="🚗" label="Make & Model" value={session.vehicle} delay={280} />
          <DetailRow icon="🎨" label="Colour" value={session.color} delay={340} />
        </View>

        {/* Parking Details */}
        <SectionHeader title="Parking" />
        <View style={styles.card}>
          <DetailRow icon="🅿️" label="Lot" value={session.lot} delay={400} />
          <DetailRow icon="📍" label="Slot" value={session.slot} delay={460} />
          <DetailRow
            icon="🕐"
            label="Check-In Time"
            value={`${formatTime(session.checkInTime)} · ${formatDate(session.checkInTime)}`}
            delay={520}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },

  // Header
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.white },
  headerCenter: { alignItems: 'center', gap: 6 },
  headerTitle: {
    fontSize: scale(17),
    fontWeight: '700',
    color: colors.white,
  },
  headerSlotChip: {
    backgroundColor: colors.green,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
  },
  headerSlotText: {
    fontSize: scale(12),
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },

  // Body
  body: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Live Timer Card
  timerCard: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    ...shadows.strong,
  },
  timerLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  liveText: {
    fontSize: scale(11),
    fontWeight: '700',
    color: colors.green,
    letterSpacing: 1.5,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerUnit: { alignItems: 'center' },
  timerDigit: {
    fontSize: scale(52),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -2,
    lineHeight: scale(56),
  },
  timerUnitLabel: {
    fontSize: scale(11),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  timerColon: {
    fontSize: scale(42),
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
  },
  timerSub: {
    marginTop: 12,
    fontSize: scale(13),
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },

  // Amount Card
  amountCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
    overflow: 'hidden',
    ...shadows.card,
  },
  amountAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.amber,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  amountTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 16,
    marginTop: 4,
  },
  amountRows: { gap: 10 },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountRowLabel: {
    fontSize: scale(14),
    color: colors.textSecondary,
  },
  amountRowValue: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  amountDivider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 4,
  },
  amountOwedLabel: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  amountOwedValue: {
    fontSize: scale(22),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  amountOwedPositive: {
    color: colors.amber,
  },
  rateChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 14,
  },
  rateChipText: {
    fontSize: scale(12),
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: scale(13),
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surface,
  },

  // Detail card
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 22,
    ...shadows.card,
  },

  // Detail row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    gap: 14,
  },
  detailIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIcon: { fontSize: 16 },
  detailTexts: { flex: 1 },
  detailLabel: {
    fontSize: scale(11),
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.textPrimary,
  },
});