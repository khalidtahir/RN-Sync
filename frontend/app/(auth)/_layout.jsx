import { StyleSheet, Text, View, StatusBar } from "react-native";
import { Stack } from "expo-router";

const AuthLayout = () => {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          unmountOnBlur: true,
        }}
      />
    </>
  );
};
export default AuthLayout;
const styles = StyleSheet.create({});
