import { Stack } from "expo-router";
import { AuthProvider } from "../services/authContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="home" />
        <Stack.Screen name="result" />
      </Stack>
    </AuthProvider>
  );
}