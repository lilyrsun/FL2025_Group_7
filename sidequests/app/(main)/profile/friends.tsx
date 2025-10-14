import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Image,
  FlatList,
  Modal,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { BACKEND_API_URL } from '@env';
import { router } from 'expo-router';
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
  receiver: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
  }
}

const Friends = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top + 24;
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'requests') {
      loadFriendRequests();
    } else if (activeTab === 'sent') {
      loadSentRequests();
    }
  }, [activeTab]);

  const loadFriends = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/friends/${user?.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setFriends(data);
      } else {
        Alert.alert('Error', data.error || 'Failed to load friends');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const loadFriendRequests = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/friends/requests/${user?.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setFriendRequests(data);
      } else {
        Alert.alert('Error', data.error || 'Failed to load friend requests');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const loadSentRequests = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/friends/sent/${user?.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSentRequests(data);
      } else {
        Alert.alert('Error', data.error || 'Failed to load sent requests');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const sendFriendRequest = async () => {
    if (!searchEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user?.id,
          receiver_email: searchEmail.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', `Friend request sent to ${data.receiver.name}`);
        setSearchEmail('');
        setShowAddFriendModal(false);
        // Refresh sent requests
        loadSentRequests();
      } else {
        Alert.alert('Error', data.error || 'Failed to send friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${BACKEND_API_URL}/friends/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendship_id: friendshipId,
          user_id: user?.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Friend request accepted!');
        loadFriendRequests();
        loadFriends();
      } else {
        Alert.alert('Error', data.error || 'Failed to accept friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${BACKEND_API_URL}/friends/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendship_id: friendshipId,
          user_id: user?.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Friend request rejected');
        loadFriendRequests();
      } else {
        Alert.alert('Error', data.error || 'Failed to reject friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const removeFriend = async (friendshipId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            try {
              const response = await fetch(`${BACKEND_API_URL}/friends/${friendshipId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id })
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Friend removed');
                loadFriends();
              } else {
                Alert.alert('Error', data.error || 'Failed to remove friend');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to connect to server');
            }
          }
        }
      ]
    );
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <Image
          source={{ uri: item.profile_picture || 'https://via.placeholder.com/50' }}
          style={styles.friendAvatar}
        />
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
          <Text style={styles.friendsSince}>
            Friends since {new Date(item.friends_since).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFriend(item.friendship_id, item.name)}
      >
        <Ionicons name="person-remove" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <Image
          source={{ uri: item.sender.profile_picture || 'https://via.placeholder.com/50' }}
          style={styles.friendAvatar}
        />
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.sender.name}</Text>
          <Text style={styles.friendEmail}>{item.sender.email}</Text>
          <Text style={styles.requestDate}>
            Sent {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => acceptFriendRequest(item.id)}
        >
          <Ionicons name="checkmark" size={20} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => rejectFriendRequest(item.id)}
        >
          <Ionicons name="close" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSentRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <Image
          source={{ uri: item.receiver.profile_picture || 'https://via.placeholder.com/50' }}
          style={styles.friendAvatar}
        />
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.receiver.name}</Text>
          <Text style={styles.friendEmail}>{item.receiver.email}</Text>
          <Text style={styles.requestDate}>
            Sent {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.sentStatus}>
        <Text style={styles.pendingText}>Pending</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#6a5acd', '#00c6ff', '#9b59b6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: statusBarHeight }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Friends</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowAddFriendModal(true)}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>


      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'friends' && (
          <View style={styles.tabContent}>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people" size={64} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptySubtext}>Start adding friends to see them here!</Text>
              </View>
            ) : (
              <FlatList
                data={friends}
                renderItem={renderFriend}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {activeTab === 'requests' && (
          <View style={styles.tabContent}>
            {friendRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail" size={64} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>No pending requests</Text>
                <Text style={styles.emptySubtext}>Friend requests will appear here</Text>
              </View>
            ) : (
              <FlatList
                data={friendRequests}
                renderItem={renderFriendRequest}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {activeTab === 'sent' && (
          <View style={styles.tabContent}>
            {sentRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="send" size={64} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>No sent requests</Text>
                <Text style={styles.emptySubtext}>Friend requests you've sent will appear here</Text>
              </View>
            ) : (
              <FlatList
                data={sentRequests}
                renderItem={renderSentRequest}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

      </ScrollView>

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriendModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddFriendModal(false)}
      >
        <LinearGradient
          colors={['#6a5acd', '#00c6ff', '#9b59b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalContainer}
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          
          {/* Modal Header */}
          <View style={[styles.modalHeader, { paddingTop: 32 }]}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setShowAddFriendModal(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.searchContainer}>
              <Text style={styles.inputLabel}>Add Friend by Email</Text>
              <LinearGradient
                colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                style={styles.inputGradient}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Enter friend's email address"
                  placeholderTextColor="rgba(106, 90, 205, 0.6)"
                  value={searchEmail}
                  onChangeText={setSearchEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </LinearGradient>
              
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendFriendRequest}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#a8a8a8', '#888888'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendButtonGradient}
                >
                  <Text style={styles.sendButtonText}>
                    {loading ? 'Sending...' : 'Send Friend Request'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

export default Friends;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  countContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  activeCount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  activeTabText: {
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  tabContent: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  friendsSince: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  requestDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  removeButton: {
    padding: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  sentStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pendingText: {
    color: '#ffa726',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  inputGradient: {
    borderRadius: 16,
    padding: 2,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
    color: '#6a5acd',
    fontWeight: '500',
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
