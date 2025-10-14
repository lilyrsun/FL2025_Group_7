import { Tabs } from "expo-router";
import { Image } from "react-native";
import { Stack } from "expo-router";

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
        name="create-event"
        options={{
          tabBarIcon: ({ size }) => (
            <Image
              source={require("../../assets/icons/add.png")}
              style={{ width: size*3, height: size*3, resizeMode: "contain" }}
            />
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