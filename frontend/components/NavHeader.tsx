import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { colors, scale } from '@/constants/theme';

interface NavHeaderProps {
  title: string;
  rightLabel?: string;
  rightIcon?: string;
  onRightPress?: () => void;
  showBack?: boolean;
}

export function NavHeader({
  title, rightLabel, rightIcon, onRightPress, showBack = true,
}: NavHeaderProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}

        <Text style={styles.title}>{title}</Text>

        {rightLabel || rightIcon ? (
          <TouchableOpacity style={styles.rightBtn} onPress={onRightPress}>
            {rightIcon && <Text style={styles.rightIcon}>{rightIcon}</Text>}
            {rightLabel && <Text style={styles.rightLabel}>{rightLabel}</Text>}
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.navy },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.navy,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: colors.white, fontWeight: '300', lineHeight: 30 },
  title: { fontSize: scale(17), fontWeight: '700', color: colors.white },
  rightBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.green, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  rightIcon: { fontSize: 14, color: colors.white },
  rightLabel: { fontSize: scale(13), fontWeight: '600', color: colors.white },
});