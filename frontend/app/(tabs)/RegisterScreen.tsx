/**
 * RegisterScreen.tsx
 * Screen: Create Account
 * Route: app/(auth)/register.tsx
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormField {
  label: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  key: keyof FormState;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  isPassword?: boolean;
  optional?: boolean;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  plate: string;
  password: string;
  confirmPassword: string;
}

// ─── Field Config ─────────────────────────────────────────────────────────────

const FIELDS: FormField[] = [
  {
    label: 'Full Name',
    placeholder: 'James Kamau',
    icon: 'person-outline',
    key: 'fullName',
    autoCapitalize: 'words',
  },
  {
    label: 'Email Address',
    placeholder: 'you@example.com',
    icon: 'mail-outline',
    key: 'email',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  },
  {
    label: 'Phone Number',
    placeholder: '07XXXXXXXX',
    icon: 'call-outline',
    key: 'phone',
    keyboardType: 'phone-pad',
  },
  {
    label: 'Vehicle Plate',
    placeholder: 'KBZ 412G',
    icon: 'car-outline',
    key: 'plate',
    //autoCapitalize: 'characters',
    optional: true,
  },
  {
    label: 'Password',
    placeholder: '••••••••',
    icon: 'lock-closed-outline',
    key: 'password',
    autoCapitalize: 'none',
    isPassword: true,
  },
  {
    label: 'Confirm Password',
    placeholder: '••••••••',
    icon: 'lock-closed-outline',
    key: 'confirmPassword',
    autoCapitalize: 'none',
    isPassword: true,
  },
];

// ─── Animated Input ───────────────────────────────────────────────────────────

function FormInput({
  field,
  value,
  onChange,
  showPassword,
  onTogglePassword,
  delay,
  hasError,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  delay: number;
  hasError?: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const borderColor = hasError
    ? '#EF4444'
    : focused
    ? Colors.primary
    : Colors.border;

  return (
    <Animated.View
      style={[
        styles.fieldWrap,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        {field.optional && (
          <View style={styles.optionalChip}>
            <Text style={styles.optionalText}>Optional</Text>
          </View>
        )}
      </View>
      <View style={[styles.inputWrap, { borderColor }]}>
        <Ionicons
          name={field.icon}
          size={17}
          color={focused ? Colors.primary : Colors.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, field.isPassword && { flex: 1 }]}
          placeholder={field.placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType={field.keyboardType ?? 'default'}
          autoCapitalize={(field.autoCapitalize as any) ?? 'sentences'}
          secureTextEntry={field.isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {field.isPassword && (
          <TouchableOpacity onPress={onTogglePassword} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={17}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current ? styles.dotDone : i === current ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const router = useRouter();
  const headerAnim = useRef(new Animated.Value(0)).current;

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    plate: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const setField = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Required';
    if (!form.email.trim() || !form.email.includes('@')) newErrors.email = 'Valid email required';
    if (!form.phone.trim() || form.phone.length < 9) newErrors.phone = 'Valid phone required';
    if (!form.password || form.password.length < 6) newErrors.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    // TODO: call your registration API
    router.replace('/driver' as any);
  };

  // Compute a rough "progress" step for the dot indicator
  const filledCount = [form.fullName, form.email, form.phone, form.password].filter(Boolean).length;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <SafeAreaView style={{ backgroundColor: Colors.primary }}>
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="chevron-back" size={20} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            {/* Decorative circles */}
            <View style={styles.circleA} />
            <View style={styles.circleB} />

            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>P</Text>
            </View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSub}>Join ParkSmart today</Text>
            <StepDots current={Math.min(filledCount, 3)} total={4} />
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* ── White Body ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formTitle}>Your Details</Text>
          <Text style={styles.formSub}>Fill in the fields below to get started</Text>

          {FIELDS.map((field, i) => (
            <FormInput
              key={field.key}
              field={field}
              value={form[field.key]}
              onChange={setField(field.key)}
              showPassword={field.key === 'password' ? showPassword : showConfirm}
              onTogglePassword={
                field.key === 'password'
                  ? () => setShowPassword((p) => !p)
                  : field.key === 'confirmPassword'
                  ? () => setShowConfirm((p) => !p)
                  : undefined
              }
              delay={80 + i * 60}
              hasError={!!errors[field.key]}
            />
          ))}

          {/* Error summary */}
          {Object.values(errors).some(Boolean) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorBannerText}>
                Please fix the highlighted fields above
              </Text>
            </View>
          )}

          {/* Create Account Button */}
          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleRegister}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>Create Account</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* Sign In link */}
          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(tabs)' as any)}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By creating an account, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.primary },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
    overflow: 'hidden',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerCenter: {
    alignItems: 'center',
    position: 'relative',
  },
  circleA: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80,
    right: -60,
  },
  circleB: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -20,
    left: -40,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoLetter: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.accent ?? '#2ECC71',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.accent ?? '#2ECC71',
    marginTop: 3,
    fontWeight: '500',
    marginBottom: 14,
  },

  // Step dots
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.white,
  },
  dotDone: {
    width: 16,
    backgroundColor: Colors.accent ?? '#2ECC71',
  },
  dotInactive: {
    width: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Body
  body: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },

  // Field
  fieldWrap: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  optionalChip: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  optionalText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg ?? '#F8FAFC',
    borderRadius: Radius.md ?? 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: 4,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },

  // Create button
  createBtn: {
    backgroundColor: Colors.accent ?? '#2ECC71',
    borderRadius: Radius.md ?? 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 20,
    shadowColor: Colors.accent ?? '#2ECC71',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  createBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Sign in row
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInPrompt: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Terms
  terms: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});