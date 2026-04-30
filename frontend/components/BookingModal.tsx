import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingSlot } from '../constants/data';
import { Colors, Radius, Shadow } from '../constants/theme';

const DURATIONS = [1, 2, 3, 4, 6, 8];
const RATE = 100; // KES per hour

interface Props {
  slot: ParkingSlot | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (slot: ParkingSlot, hours: number) => void;
}

export default function BookingModal({ slot, visible, onClose, onConfirm }: Props) {
  const [selectedHours, setSelectedHours] = useState(1);

  if (!slot) return null;

  const total = selectedHours * RATE;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconLetter}>P</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Book Slot {slot.id}</Text>
            <Text style={styles.subtitle}>Zone {slot.zone} · KES {RATE}/hr</Text>
          </View>
        </View>

        {/* Duration Selector */}
        <Text style={styles.sectionLabel}>Select Duration</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.durationBtn, selectedHours === h && styles.durationBtnActive]}
              onPress={() => setSelectedHours(h)}
            >
              <Text style={[styles.durationNum, selectedHours === h && styles.durationNumActive]}>
                {h}
              </Text>
              <Text style={[styles.durationUnit, selectedHours === h && styles.durationUnitActive]}>
                hr
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View style={styles.amountBox}>
          <View>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>KES {total.toLocaleString()}</Text>
          </View>
          <View style={styles.mpesaBox}>
            <Ionicons name="phone-portrait-outline" size={20} color={Colors.accent} />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.mpesaLabel}>M-Pesa</Text>
              <Text style={styles.mpesaNumber}>0712345678</Text>
            </View>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => onConfirm(slot, selectedHours)}
          activeOpacity={0.85}
        >
          <Ionicons name="phone-portrait-outline" size={18} color={Colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.payText}>Pay KES {total.toLocaleString()} via M-Pesa</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  headerText: {},
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  durationBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  durationBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationNum: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  durationNumActive: {
    color: Colors.white,
  },
  durationUnit: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  durationUnitActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  mpesaBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mpesaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  mpesaNumber: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  payBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  payText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});