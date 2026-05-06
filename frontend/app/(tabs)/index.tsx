import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { DEMO_ACCOUNTS } from '../../constants/data';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface FormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const router = useRouter();
  //const [email, setEmail] = useState('');
  //const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try{
      const res =  await fetch('http://192.168.0.11:8000/api/v1/auth/login',{
        method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password:formData.password,
          }),
      });
      
      clearTimeout(timeout);
      const data = await res.json();

      if (res.ok){
        const {token, user} = data;
        const userRole = user.role;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('role', userRole);

        if (userRole === 'county'){
          router.push('/(tabs)')
        } else if(userRole === 'attendant'){
          router.push('/(tabs)/attendant')
        }else if (userRole ==='admin'){
          router.push('/(tabs)/admin')
        }else{
          router.push('/(tabs)/driver')
        }
      }else{
        console.error('Login failed:', data.message);
      }
    }catch(error){
      console.error('Error signing in:', error);
    }finally{
      setLoading(false);
    }
  };

  const fillDemo = (acc: any) => {
    setFormData({
      email: acc.email,
      password: acc.password || '', // assuming your demo data has password
    });
  };


  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
          {/* Header */}
          <View style={styles.header}>
            {/* Background circles */}
            <View style={styles.circleLarge} />
            <View style={styles.circleMedium} />

            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoLetter}>P</Text>
              </View>
            </View>
            <Text style={styles.appName}>ParkSmart</Text>
            <Text style={styles.tagline}>Smart parking, effortlessly.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to manage your parking</Text>

            {/* Email */}
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({...prev, email:text}))}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({...prev, password:text}))}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn} activeOpacity={0.85} disabled={loading}>
              {loading ? (
                  <Text style={styles.signInText}>Signing in…</Text>
                  ) : (
                    <>
                      <Text style={styles.signInText}>Sign In</Text>
                    </>
              )}
            </TouchableOpacity>

            {/* ── NEW: Register link ── */}
            <View style={styles.registerRow}>
                <Text style={styles.registerPrompt}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/RegisterScreen' as any)}
                    activeOpacity={0.75}
                          >
                    <Text style={styles.registerLink}>Sign Up</Text>
                  </TouchableOpacity>
            </View>
            

            {/* Demo Accounts */}
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Demo Accounts</Text>
              {DEMO_ACCOUNTS.map((acc) => (
                <TouchableOpacity key={acc.role} style={styles.demoRow} onPress={() => fillDemo(acc)}>
                  <View style={[styles.demoDot, { backgroundColor: acc.color }]} />
                  <Text style={styles.demoRole}>{acc.role}: </Text>
                  <Text style={styles.demoEmail}>{acc.email}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.demoHint}>Tap any row to auto-fill credentials</Text>
  
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 48,
    overflow: 'hidden',
    position: 'relative',
  },
  circleLarge: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -40,
  },
  circleMedium: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: 30,
    right: 40,
  },
  logoWrap: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.accent,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.accent,
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    ...Shadow.lg,
  },
  welcome: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerPrompt: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
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
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 14,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    ...Shadow.md,
  },
  signInText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 10,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  demoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  demoRole: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  demoEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  demoHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
});