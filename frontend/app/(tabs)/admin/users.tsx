/**
 * ManageUsersScreen — app/(admin)/users.tsx
 * Shows searchable, filterable user list with role badges
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, StatusBar, TextInput, RefreshControl,
} from 'react-native';
import { NavHeader } from '@/components/NavHeader';
import { colors, shadows, scale } from '@/constants/theme';
import { USERS, User } from '@/constants/adminData';

type RoleFilter = 'all' | 'driver' | 'attendant' | 'admin' | 'county';

const ROLE_CONFIG: Record<string, { label:string; bg:string; text:string; avatarBg:string }> = {
  driver:    { label:'Driver',         bg:'#E8FBF5', text:colors.green, avatarBg:'#00C48C' },
  attendant: { label:'Attendant',      bg:'#FEF6E7', text:colors.amber, avatarBg:'#F5A623' },
  admin:     { label:'Admin',          bg:'#EEF1F6', text:colors.navy,  avatarBg:'#8A94A6' },
  county:    { label:'County Official',bg:'#F0EEFF', text:'#6C63FF',   avatarBg:'#6C63FF' },
};

// ── User Row ──────────────────────────────────────────────────────────────────
function UserRow({ user, index }: { user: User; index: number }) {
  const slideAnim = useRef(new Animated.Value(14)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:300, delay: index * 60, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:300, delay: index * 60, useNativeDriver:true }),
    ]).start();
  }, []);

  const config = ROLE_CONFIG[user.role];

  return (
    <Animated.View style={{ opacity: fadeAnim, transform:[{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.userRow} activeOpacity={0.75}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: user.avatarColor + '30' }]}>
          <Text style={[styles.avatarText, { color: user.avatarColor }]}>
            {user.name.charAt(0)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Right: role + online dot */}
        <View style={styles.userRight}>
          <View style={[styles.rolePill, { backgroundColor: config.bg }]}>
            <Text style={[styles.roleText, { color: config.text }]}>{config.label}</Text>
          </View>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: user.online ? colors.green : colors.textMuted }]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ManageUsersScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const FILTERS: Array<{ key: RoleFilter; label: string }> = [
    { key:'all',       label:'All'       },
    { key:'driver',    label:'Driver'    },
    { key:'attendant', label:'Attendant' },
    { key:'admin',     label:'Admin'     },
    { key:'county',    label:'County'    },
  ];

  const filtered = USERS.filter(u => {
    const matchesRole   = filter === 'all' || u.role === filter;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <NavHeader title="Manage Users" />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search users..."
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize:16, color:colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User list */}
      <FlatList
        data={filtered}
        keyExtractor={u => u.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(()=>setRefreshing(false),1000); }} tintColor={colors.green} />
        }
        renderItem={({ item, index }) => <UserRow user={item} index={index} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, backgroundColor: colors.surface },
  searchWrap: { padding:16, paddingBottom:8, backgroundColor:colors.white },
  searchBox: {
    flexDirection:'row', alignItems:'center',
    backgroundColor:colors.surface, borderRadius:14,
    paddingHorizontal:14, height:48,
    borderWidth:1, borderColor:colors.border,
  },
  searchIcon: { fontSize:16, marginRight:8 },
  searchInput: { flex:1, fontSize:scale(14), color:colors.textPrimary },
  filterRow: {
    flexDirection:'row', flexWrap:'wrap', gap:8,
    paddingHorizontal:16, paddingVertical:10,
    backgroundColor:colors.white,
    borderBottomWidth:1, borderBottomColor:colors.border,
  },
  filterTab: { paddingHorizontal:14, paddingVertical:6, borderRadius:20, backgroundColor:colors.surface },
  filterTabActive: { backgroundColor:colors.navy },
  filterText: { fontSize:scale(12), fontWeight:'600', color:colors.textSecondary },
  filterTextActive: { color:colors.white },
  list: { padding:16, paddingBottom:40 },
  userRow: {
    flexDirection:'row', alignItems:'center',
    backgroundColor:colors.white, borderRadius:16,
    padding:14, marginBottom:10,
    ...shadows.card,
  },
  avatar: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center', marginRight:12 },
  avatarText: { fontSize:scale(18), fontWeight:'700' },
  userInfo: { flex:1 },
  userName: { fontSize:scale(15), fontWeight:'700', color:colors.textPrimary },
  userEmail: { fontSize:scale(12), color:colors.textSecondary, marginTop:2 },
  userRight: { alignItems:'flex-end', gap:6 },
  rolePill: { paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  roleText: { fontSize:scale(11), fontWeight:'600' },
  onlineRow: { flexDirection:'row', alignItems:'center', gap:4 },
  onlineDot: { width:8, height:8, borderRadius:4 },
  empty: { alignItems:'center', paddingVertical:60 },
  emptyIcon: { fontSize:48, marginBottom:12 },
  emptyText: { fontSize:scale(15), color:colors.textSecondary },
});