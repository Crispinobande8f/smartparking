/**
 * CheckInScreen.tsx
 * Screen: Attendant vehicle check-in — plate input, driver name, slot selection
 * Route: app/(attendant)/checkin.tsx
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { AVAILABLE_SLOTS } from '@/constants/mockData';
import { colors, shadows, scale } from '@/constants/theme';

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Labelled input field */
function FormField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
  error,
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  error?: string;
}) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () =>
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlur = () =>
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.green],
  });

  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <Animated.View
        style={[
          fieldStyles.inputWrap,
          error ? fieldStyles.inputError : null,
          { borderBottomColor: borderColor, borderBottomWidth: 2 },
        ]}
      >
        <Text style={fieldStyles.icon}>{icon}</Text>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize={autoCapitalize ?? 'characters'}
          autoCorrect={false}
        />
      </Animated.View>
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: scale(13),
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: { borderWidth: 1.5, borderColor: colors.red },
  icon: { fontSize: 18, marginRight: 12 },
  input: {
    flex: 1,
    fontSize: scale(15),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  error: {
    fontSize: scale(12),
    color: colors.red,
    marginTop: 4,
    marginLeft: 4,
  },
});

// ─── Slot Pill ───────────────────────────────────────────────────────────────

function SlotPill({
  slot,
  selected,
  onPress,
}: {
  slot: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.slotPill, selected && styles.slotPillSelected]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        <Text style={[styles.slotPillText, selected && styles.slotPillTextSelected]}>
          {slot}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CheckInScreen() {
  const [plate, setPlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!plate.trim()) e.plate = 'Plate number is required';
    if (!driverName.trim()) e.driverName = 'Driver name is required';
    if (!selectedSlot) e.slot = 'Please select a slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    setLoading(true);
    // TODO: POST /api/v1/sessions with { plate, driverName, slotId }
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Check-In Successful ✅',
        `${plate} assigned to Slot ${selectedSlot}`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    }, 1600);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Navy Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Check-In</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          >
            {/* Vehicle Details Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Text style={styles.cardIcon}>🚗</Text>
                </View>
                <Text style={styles.cardTitle}>Vehicle Details</Text>
              </View>

              <FormField
                label="Vehicle Plate Number"
                icon="🚗"
                value={plate}
                onChangeText={setPlate}
                placeholder="KBZ 412G"
                autoCapitalize="characters"
                error={errors.plate}
              />
              <FormField
                label="Driver Name"
                icon="👤"
                value={driverName}
                onChangeText={setDriverName}
                placeholder="James Kamau"
                autoCapitalize="words"
                error={errors.driverName}
              />
            </View>

            {/* Assign Slot Card */}
            <View style={[styles.card, { marginTop: 12 }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrap, { backgroundColor: '#EEF1F6' }]}>
                  <Text style={styles.cardIcon}>🅿️</Text>
                </View>
                <Text style={styles.cardTitle}>Assign Slot</Text>
              </View>

              <Text style={styles.slotSectionLabel}>Available Slots</Text>

              {errors.slot ? (
                <Text style={styles.slotError}>{errors.slot}</Text>
              ) : null}

              <View style={styles.slotsGrid}>
                {AVAILABLE_SLOTS.map((slot) => (
                  <SlotPill
                    key={slot}
                    slot={slot}
                    selected={selectedSlot === slot}
                    onPress={() => setSelectedSlot(slot)}
                  />
                ))}
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.confirmIcon}>→|</Text>
                  <Text style={styles.confirmLabel}>Confirm Check-In</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },

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

  // Scroll
  scroll: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 18 },
  cardTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Slots
  slotSectionLabel: {
    fontSize: scale(13),
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  slotError: {
    fontSize: scale(12),
    color: colors.red,
    marginBottom: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 52,
    alignItems: 'center',
  },
  slotPillSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  slotPillText: {
    fontSize: scale(13),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotPillTextSelected: { color: colors.white },

  // Confirm button
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.green,
    borderRadius: 16,
    height: 58,
    marginTop: 20,
    ...shadows.strong,
  },
  confirmBtnDisabled: { opacity: 0.65 },
  confirmIcon: { fontSize: 20, color: colors.white, fontWeight: '700' },
  confirmLabel: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.white,
  },
});