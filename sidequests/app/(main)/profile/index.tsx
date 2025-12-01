import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BACKEND_API_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';

interface Friend {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  friendship_id: string;
  friends_since: string;
}

interface FriendRequest {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
  };
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const metadata = user?.user_metadata || {};
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top + 24;

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  useEffect(() => {
    loadFriendsData();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadFriendsData();
    }, [user?.id])
  );

  const loadFriendsData = async () => {
    if (!user?.id) return;

    try {
      // Load friends
      const friendsResponse = await fetch(`${BACKEND_API_URL}/friends/${user?.id}`);
      const friendsData = await friendsResponse.json();
      
      if (friendsResponse.ok) {
        setFriends(friendsData);
      }

      // Load friend requests
      const requestsResponse = await fetch(`${BACKEND_API_URL}/friends/requests/${user?.id}`);
      const requestsData = await requestsResponse.json();
      
      if (requestsResponse.ok) {
        setFriendRequests(requestsData);
      }

      // Load sent friend requests
      const sentReponse = await fetch(`${BACKEND_API_URL}/friends/sent/${user?.id}`);
      const sentData = await sentReponse.json();

      if (sentReponse.ok) {
        setSentRequests(sentData);
      }
    } catch (error) {
      console.error('Failed to load friends data:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  return (
    <LinearGradient
        colors={['#6a5acd', '#00c6ff', '#9b59b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: statusBarHeight }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>👤 Profile</Text>
          <Text style={styles.subheading}>Your account information</Text>
        </View>

        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <Image 
              source={{ uri: metadata?.avatar_url }}
              style={styles.avatar}
            />
            <Text style={styles.name}>{metadata?.full_name || "Unnamed User"}</Text>
            <Text style={styles.email}>{metadata?.email || "No email"}</Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.inputLabel}>Account Info</Text>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoGradient}
          >
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Provider</Text>
              <Text style={styles.infoValue}>{user?.app_metadata?.provider || 'N/A'}</Text>
            </View>
            <View style={styles.infoItemSeparator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValue}>{user?.id || 'N/A'}</Text>
            </View>
            <View style={styles.infoItemSeparator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</Text>
            </View>
            <View style={styles.infoItemSeparator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Sign-In</Text>
              <Text style={styles.infoValue}>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</Text>
            </View>
          </LinearGradient>
        </View>


        {/* Friends Section */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Manage Friends</Text>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoGradient}
          >
            <TouchableOpacity 
              style={styles.friendsSection}
              onPress={() => router.push('/profile/friends')}
            >
              <View style={styles.friendsInfo}>
                <View style={styles.friendsStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{friends.length}</Text>
                    <Text style={styles.statLabel}>Friends</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{friendRequests.length}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{sentRequests.length}</Text>
                    <Text style={styles.statLabel}>Sent</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </View>
            </TouchableOpacity>

            {/* Quick Friends Preview */}
            {friends.length > 0 && (
              <View style={styles.friendsPreview}>
                <Text style={styles.previewLabel}>Your Friends</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsScroll}>
                  {friends.slice(0, 5).map((friend) => (
                    <View key={friend.id} style={styles.friendPreview}>
                      <Image
                        source={{ uri: friend.profile_picture || 'https://via.placeholder.com/40' }}
                        style={styles.friendPreviewAvatar}
                      />
                      <Text style={styles.friendPreviewName} numberOfLines={1}>
                        {friend.name}
                      </Text>
                    </View>
                  ))}
                  {friends.length > 5 && (
                    <View style={styles.moreFriends}>
                      <Text style={styles.moreFriendsText}>+{friends.length - 5}</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutGradient}
          >
            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

export default Profile

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // 60px (tab bar) + 40px (padding)
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  profileCard: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoGradient: {
    borderRadius: 16,
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoItemSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    flex: 2,
    textAlign: 'right',
  },
  logoutContainer: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  logoutGradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  logoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  friendsSection: {
    padding: 20,
  },
  friendsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendsStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  friendsPreview: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  friendsScroll: {
    flexDirection: 'row',
  },
  friendPreview: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  friendPreviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
  },
  friendPreviewName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  moreFriends: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  moreFriendsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
});