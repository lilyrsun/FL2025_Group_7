import React, { useRef, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetFlatList, BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import type { ListRenderItem } from "react-native";
import { Event } from "../types/event";
import BottomSheetHeader from "./BottomSheetHeader";
import { BlurView } from "expo-blur";

type Props = {
  events: Event[];
};

function CustomBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <BlurView style={[style, styles.background]}>
      <View style={styles.overlay} />
    </BlurView>
  );
}

const EventBottomSheet: React.FC<Props> = ({ events }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["10%", "25%", "50%", "90%"], []);
  const [mode, setMode] = useState<"Spontaneous" | "RSVP">("RSVP");

  const filteredEvents = events.filter((e) => e.type === mode);

  const renderItem: ListRenderItem<Event> = ({ item }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>{item.date}</Text>
    </View>
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