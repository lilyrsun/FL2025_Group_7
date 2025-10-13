import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Profile = () => {
  const { user, signOut } = useAuth();
  const metadata = user?.user_metadata || {};
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top + 24;

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>
      <View style={styles.header}>
        <Image 
          source={{ uri: metadata?.avatar_url }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{metadata?.full_name || "Unnamed User"}</Text>
        <Text style={styles.email}>{metadata?.email || "No email"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        <Text style={styles.info}>Provider: {user?.app_metadata?.provider || 'N/A'}</Text>
        <Text style={styles.info}>User ID: {user?.id || 'N/A'}</Text>
        <Text style={styles.info}>Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</Text>
        <Text style={styles.info}>Last Sign In: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#555',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  logoutButton: {
    marginTop: 'auto',
    backgroundColor: '#6a4c93',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});