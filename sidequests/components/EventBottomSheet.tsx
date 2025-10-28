import React, { useRef, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import BottomSheet, { BottomSheetFlatList, BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import type { ListRenderItem } from "react-native";
import { Event } from "../types/event";
import BottomSheetHeader from "./BottomSheetHeader";
import { BlurView } from "expo-blur";
import { Ionicons } from '@expo/vector-icons';
import { SpontaneousPresence } from "../hooks/useSpontaneous";

type Props = {
  events: Event[];
  spontaneousPresences?: SpontaneousPresence[];
  onOpen?: (eventId: string) => void;
  onPresenceTap?: (presence: SpontaneousPresence) => void;
};

function CustomBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <BlurView style={[style, styles.background]}>
      <View style={styles.overlay} />
    </BlurView>
  );
}

const EventBottomSheet: React.FC<Props> = ({ events, spontaneousPresences = [], onOpen, onPresenceTap }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["10%", "25%", "50%", "90%"], []);
  const [mode, setMode] = useState<"Spontaneous" | "RSVP">("RSVP");

  const filteredEvents = events.filter((e) => e.type === mode);

  const renderEventItem: ListRenderItem<Event> = ({ item }) => (
    <TouchableOpacity
      onPress={() => (onOpen ? onOpen(item.id) : router.push({ pathname: "/event/[id]", params: { id: item.id } }))}
      style={styles.eventCard}
    >
      <View style={styles.row}>
        <Image
          source={{ uri: item.users?.profile_picture || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDate}>{new Date(item.date).toLocaleString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.7)" />
      </View>
    </TouchableOpacity>
  );

  const renderPresenceItem: ListRenderItem<SpontaneousPresence> = ({ item }) => (
    <TouchableOpacity
      onPress={() => onPresenceTap && onPresenceTap(item)}
      style={styles.eventCard}
    >
      <View style={styles.row}>
        <Image
          source={{ uri: item.users?.profile_picture || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle}>{item.users?.name || 'Friend'}</Text>
          <Text style={styles.eventDate}>{item.status_text}</Text>
          <Text style={styles.liveIndicator}>
            <Ionicons name="radio-button-on" size={12} color="#4CAF50" /> Live
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.7)" />
      </View>
    </TouchableOpacity>
  );

  return (
    <BottomSheet index={1} // initial snap index
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backgroundComponent={(props) => <CustomBackground {...props} />}
    >
      <BottomSheetHeader mode={mode} setMode={setMode} />

      {mode === "Spontaneous" ? (
        <BottomSheetFlatList<SpontaneousPresence>
          data={spontaneousPresences}
          keyExtractor={(item) => item.id}
          renderItem={renderPresenceItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No friends sharing their location</Text>
              <Text style={styles.emptySubtext}>Tell your friends to start sharing!</Text>
            </View>
          }
        />
      ) : (
        <BottomSheetFlatList<Event>
          data={filteredEvents}
          keyExtractor={(item : Event) => item.id}
          renderItem={renderEventItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No {mode.toLowerCase()} events</Text>
              <Text style={styles.emptySubtext}>Create an event to get started!</Text>
            </View>
          }
        />
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  toggle: {
    fontSize: 16,
    color: "#888",
    padding: 5,
  },
  active: {
    color: "#000",
    fontWeight: "bold",
  },
  eventCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  eventDate: {
    fontSize: 14,
    color: "#555",
  },
  background: {
    borderRadius: 36,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff99",
  },
  liveIndicator: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});

export default EventBottomSheet;