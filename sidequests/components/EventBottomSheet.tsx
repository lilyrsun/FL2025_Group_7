import React, { useRef, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import BottomSheet, { BottomSheetFlatList, BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import type { ListRenderItem } from "react-native";
import { Event } from "../types/event";
import BottomSheetHeader from "./BottomSheetHeader";
import { BlurView } from "expo-blur";
import { Ionicons } from '@expo/vector-icons';

type Props = {
  events: Event[];
  onOpen?: (eventId: string) => void;
};

function CustomBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <BlurView style={[style, styles.background]}>
      <View style={styles.overlay} />
    </BlurView>
  );
}

const EventBottomSheet: React.FC<Props> = ({ events, onOpen }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["10%", "25%", "50%", "90%"], []);
  const [mode, setMode] = useState<"Spontaneous" | "RSVP">("RSVP");

  const filteredEvents = events.filter((e) => e.type === mode);

  const renderItem: ListRenderItem<Event> = ({ item }) => (
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

  return (
    <BottomSheet index={1} // initial snap index
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backgroundComponent={(props) => <CustomBackground {...props} />}
    >
      <BottomSheetHeader mode={mode} setMode={setMode} />

      <BottomSheetFlatList<Event>
        data={filteredEvents}
        keyExtractor={(item : Event) => item.id}
        renderItem={renderItem}
      />
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
});

export default EventBottomSheet;