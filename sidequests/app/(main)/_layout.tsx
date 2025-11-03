import { Tabs } from "expo-router";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ size }) => (
            <Image
              source={require("../../assets/icons/map.png")}
              style={{ width: size*3, height: size*3, resizeMode: "contain" }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="your-plot"
        options={{
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="book" size={size*2} color={color || "#ffffff"} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ size }) => (
            <Image
              source={require("../../assets/icons/profile.png")}
              style={{ width: size*3, height: size*3, resizeMode: "contain" }}
            />
          ),
        }}
      />
    </Tabs>
  );
}