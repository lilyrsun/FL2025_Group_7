import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { SpontaneousPresence } from '../hooks/useSpontaneous';
import { useAuth } from '../context/AuthContext';

type Props = {
  myPresence: SpontaneousPresence | null;
  spontaneousPresences: SpontaneousPresence[];
  currentUserId: string | null;
  onPresencePress: (presenceId: string) => void;
};

const SpontaneousPresenceMarkers: React.FC<Props> = ({
  myPresence,
  spontaneousPresences,
  currentUserId,
  onPresencePress,
}) => {
  const { user } = useAuth();
  // Render a single presence marker
  const renderPresenceMarker = (presence: SpontaneousPresence, isOwnPresence: boolean = false) => {
    const hasProfilePicture = !!presence.users?.profile_picture;
    const title = isOwnPresence ? 'You' : (presence.user_id === currentUserId ? 'You' : (presence.users?.name || 'Friend'));

    console.log('presence', user.user_metadata.email, presence);

    return (
      <Marker
        key={presence.id}
        coordinate={{
          latitude: presence.latitude,
          longitude: presence.longitude,
        }}
        title={title}
        description={presence.status_text}
        onPress={() => {
          console.log('Tapped spontaneous presence:', presence);
          onPresencePress(presence.id);
        }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={[
          styles.presenceMarker,
          presence.visibility === 'public' ? styles.presenceMarkerPublic : styles.presenceMarkerFriends
        ]}>
          <Image
            source={{ uri: isOwnPresence ? user?.user_metadata?.avatar_url : presence.users?.profile_picture }}
            style={styles.profileImage}
          />
          <View style={[
            styles.statusDot,
            presence.visibility === 'public' ? styles.statusDotPublic : styles.statusDotFriends
          ]} />
        </View>
      </Marker>
    );
  };

  return (
    <>
      {/* Include user's own presence if active and not already in the list */}
      {myPresence && myPresence.is_active && !spontaneousPresences.find(p => p.id === myPresence.id) && (
        renderPresenceMarker(myPresence, true)
      )}

      {/* Render all other spontaneous presences */}
      {spontaneousPresences.map((presence) => renderPresenceMarker(presence, false))}
    </>
  );
};

const styles = StyleSheet.create({
  presenceMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presenceMarkerPublic: {
    borderColor: '#4CAF50',
  },
  presenceMarkerFriends: {
    borderColor: '#6a5acd',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusDotPublic: {
    backgroundColor: '#4CAF50',
  },
  statusDotFriends: {
    backgroundColor: '#6a5acd',
  },
  smallPin: {
    width: 32,
    height: 40,
  },
});

export default SpontaneousPresenceMarkers;
