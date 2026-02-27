import "react-native-get-random-values";

import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import { UserProvider } from "../contexts/UserContext";

const RootLayout = () => {
  return (
    <UserProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f2f2f2",
          },
          headerTintColor: "#000000",
          unmountOnBlur: true,
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: true, title: "Login" }}
        />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />

        <Stack.Screen name="index" options={{ title: "Home" }} />
      </Stack>
    </UserProvider>
  );
};
export default RootLayout;
const styles = StyleSheet.create({});
