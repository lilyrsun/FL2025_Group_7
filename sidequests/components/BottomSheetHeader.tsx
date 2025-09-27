import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

type Mode = "Spontaneous" | "RSVP";

interface Props {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const tabs: Mode[] = ["Spontaneous", "RSVP"];
const screenWidth = Dimensions.get("window").width;

const BottomSheetHeader: React.FC<Props> = ({ mode, setMode }) => {
  const activeIndex = tabs.indexOf(mode);
  const indicator = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: activeIndex,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  }, [activeIndex]);

  const tabWidth = screenWidth / tabs.length;

  const translateX = indicator.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth],
  });

  return (
    <BlurView intensity={50} tint="light" style={styles.headerContainer}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setMode(tab)}
            hitSlop={{top: 10, bottom: 10, left: 20, right: 20}}
          >
            <Text style={[styles.tabText, mode === tab && styles.activeText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View
        style={[
          styles.indicatorWrapper,
          { width: tabWidth, transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={["#6a5acd", "#00c6ff", "#9b59b6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.indicator}
        />
      </Animated.View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    position: "relative",
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    color: "#aaa",
    fontWeight: "600",
  },
  activeText: {
    color: "#000",
    fontWeight: "700",
  },
  indicatorWrapper: {
    height: 4,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  indicator: {
    flex: 1,
    borderRadius: 2,
  },
});

export default BottomSheetHeader;