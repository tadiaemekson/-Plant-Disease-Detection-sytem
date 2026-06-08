import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  History,
  ShieldCheck,
} from "lucide-react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === "dark" ? "dark" : "light") as keyof typeof Colors;
  const theme = Colors[scheme];

  const user = {
    name: "Grower Pro",
    email: "grower@agroscan.ai",
    badge: "Master Cultivator 🌿",
  };

  const menuItems = [
    { icon: User, label: "My Farms & Crops", color: "#16A34A" },
    { icon: History, label: "Scan History Logs", color: "#16A34A" },
    { icon: ShieldCheck, label: "Premium License", color: "#F59E0B" },
    { icon: Settings, label: "Account Settings", color: "#64748B" },
    { icon: Bell, label: "Farming Notifications", color: "#64748B" },
    { icon: HelpCircle, label: "AgroScan Support", color: "#64748B" },
  ];

  const handleLogout = () => {
    router.replace("/welcome");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* HEADER TITLE */}
        <Text style={[styles.title, { color: theme.text }]}>Farmer Profile</Text>

        {/* PROFILE HEADER CARD */}
        <View style={[styles.headerCard, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
              }}
              style={styles.avatar}
            />
            <View style={styles.cameraIcon}>
              <Camera color="#fff" size={14} />
            </View>
          </View>

          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user.badge}</Text>
          </View>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user.email}</Text>
        </View>

        {/* MENU */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <Pressable 
                key={index} 
                style={[styles.menuItem, { backgroundColor: theme.backgroundElement }]}
                android_ripple={{ color: theme.backgroundSelected }}
              >
                <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                  <Icon color={item.color} size={20} />
                </View>

                <Text style={[styles.menuText, { color: theme.text }]}>{item.label}</Text>

                <ChevronRight color={theme.textSecondary} size={18} />
              </Pressable>
            );
          })}
        </View>

        {/* LOGOUT */}
        <Pressable 
          style={[styles.logout, { backgroundColor: theme.backgroundElement }]} 
          onPress={handleLogout}
        >
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Log Out Session</Text>
        </Pressable>

      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={[styles.bottomNav, { backgroundColor: theme.backgroundElement, borderTopColor: theme.backgroundSelected }]}>
        <Pressable style={styles.navItem} onPress={() => router.push("/home")}>
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Home</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/scan")}>
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Camera</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/profile")}>
          <Text style={[styles.navText, { color: "#16A34A", fontWeight: "bold" }]}>
            Profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 130,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 35,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  headerCard: {
    alignItems: "center",
    paddingVertical: 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.02)",
      },
    }),
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#16A34A",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#16A34A",
    padding: 6,
    borderRadius: 15,
    elevation: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  badge: {
    backgroundColor: "rgba(22, 163, 74, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#16A34A",
  },
  email: {
    fontSize: 13,
  },
  menu: {
    marginTop: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.01)",
      },
    }),
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 15,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.1)",
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "bold",
    fontSize: 15,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 95,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 25,
  },
  navText: {
    fontSize: 13,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});