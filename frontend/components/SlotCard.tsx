import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingSlot, SlotStatus } from '../constants/data';
import { Colors, Radius, Shadow } from '../constants/theme';

const STATUS_CONFIG: Record<SlotStatus, {
  color: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelBg: string;
  labelText: string;
}> = {
  free: {
    color: Colors.free,
    label: 'Free',
    icon: 'checkmark-circle',
    labelBg: '#E6FAF5',
    labelText: Colors.free,
  },
  taken: {
    color: Colors.taken,
    label: 'Taken',
    icon: 'car',
    labelBg: '#FEECEC',
    labelText: Colors.taken,
  },
  reserved: {
    color: Colors.reserved,
    label: 'Reserved',
    icon: 'bookmark',
    labelBg: '#FEF3E7',
    labelText: Colors.reserved,
  },
  leaving: {
    color: Colors.leaving,
    label: 'Leaving',
    icon: 'exit',
    labelBg: '#EBF2FF',
    labelText: Colors.leaving,
  },
};

interface Props {
  slot: ParkingSlot;
  onPress?: (slot: ParkingSlot) => void;
}

export default function SlotCard({ slot, onPress }: Props) {
  const cfg = STATUS_CONFIG[slot.status];
  const isSelectable = slot.status === 'free';

  return (
    <TouchableOpacity
      style={[styles.card, { borderTopColor: cfg.color }]}
      onPress={() => isSelectable && onPress?.(slot)}
      activeOpacity={isSelectable ? 0.7 : 1}
    >
      <Ionicons name={cfg.icon} size={28} color={cfg.color} />
      <Text style={styles.slotId}>{slot.id}</Text>
      <View style={[styles.badge, { backgroundColor: cfg.labelBg }]}>
        <Text style={[styles.badgeText, { color: cfg.labelText }]}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 5,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderTopWidth: 3,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    ...Shadow.sm,
    minWidth: 90,
    maxWidth: '33%',
  },
  slotId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});