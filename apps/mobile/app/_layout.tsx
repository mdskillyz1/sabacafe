import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FFF7EA" },
        headerTintColor: "#3B2118",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: "#FFFAF1" }
      }}
    />
  );
}
