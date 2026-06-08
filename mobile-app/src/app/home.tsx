import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search,
  Home as HomeIcon,
  Camera as CameraIcon,
  User as UserIcon,
  BookOpen,
  Sprout,
  Compass,
} from "lucide-react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/* =========================
   DISEASE DATA
   ========================= */
export const diseases = [
  {
    key: "apple_scab",
    title: "Apple Scab",
    image: require("../../assets/images/apple_scab.jpg"),
    cause: "Caused by Venturia inaequalis fungus in humid conditions.",
    prevention: [
      "Remove infected leaves and rake under trees.",
      "Apply fungicide early in the spring season.",
      "Prune branches regularly to improve air circulation.",
      "Avoid overhead watering; use drip systems instead.",
    ],
  },
  {
    key: "corn_common_rust",
    title: "Corn Common Rust",
    image: require("../../assets/images/corn_common_rust.jpg"),
    cause: "Caused by Puccinia sorghi fungus spread by wind.",
    prevention: [
      "Plant rust-resistant corn hybrid varieties.",
      "Use appropriate fungicide sprays if lesions appear.",
      "Quickly remove and destroy infected foliage.",
      "Avoid dense planting to facilitate faster leaf drying.",
    ],
  },
  {
    key: "grape_black_rot",
    title: "Grape Black Rot",
    image: require("../../assets/images/grape_black_rot.jpg"),
    cause: "Fungal disease caused by warm, wet conditions.",
    prevention: [
      "Prune grapevines regularly and keep them off the ground.",
      "Meticulously remove and discard infected fruits.",
      "Apply copper-based or organic protective spray.",
      "Clear fallen debris from the vine rows.",
    ],
  },
  {
    key: "pepper_bacterial_spot",
    title: "Pepper Bacterial Spot",
    image: require("../../assets/images/pepper_bacterial_spot.jpg"),
    cause: "Bacterial infection spread by water splash.",
    prevention: [
      "Only buy pathogen-free certified seeds.",
      "Avoid overhead irrigation to keep leaves dry.",
      "Apply protective copper-containing bactericides.",
      "Rotate crops out of nightshades for two years.",
    ],
  },
  {
    key: "potato_early_blight",
    title: "Potato Early Blight",
    image: require("../../assets/images/potato_early_blight.jpg"),
    cause: "Caused by Alternaria solani fungus.",
    prevention: [
      "Regularly remove and discard infected lower leaves.",
      "Use preventive organic or copper-based fungicide.",
      "Rotate potato crops with non-solanaceous species.",
      "Maintain adequate nitrogen and phosphorus levels.",
    ],
  },
  {
    key: "tomato_late_blight",
    title: "Tomato Late Blight",
    image: require("../../assets/images/tomato_late_blight.jpg"),
    cause: "Caused by Phytophthora infestans in wet weather.",
    prevention: [
      "Ensure foliage remains dry via drop-irrigation.",
      "Apply preventive fungicide spray during wet seasons.",
      "Uproot and destroy heavily infected tomato plants.",
      "Establish wide spacing between rows to enhance airflow.",
    ],
  },
];

/* =========================
   AGRICULTURAL TIPS DATA
   ========================= */
const weeklyTips = [
  {
    id: 1,
    title: "Understanding Soil pH",
    desc: "Maintaining correct soil acidity enables root systems to absorb nutrients cleanly.",
    icon: Sprout,
    tag: "Soil Health",
  },
  {
    id: 2,
    title: "Early Blight Prevention",
    desc: "Watering close to the ground keeps leaves dry, preventing spore germination.",
    icon: BookOpen,
    tag: "Disease Prevention",
  },
  {
    id: 3,
    title: "Crop Rotation Guide",
    desc: "Never plant peppers, potatoes, or tomatoes in the same soil back-to-back.",
    icon: Compass,
    tag: "Best Practices",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === "dark" ? "dark" : "light") as keyof typeof Colors;
  const theme = Colors[scheme];

  // Filter diseases based on search query
  const filteredDiseases = diseases.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.backgroundElement }]}>
        <Text style={styles.appName}>AgroScan</Text>
        <View style={styles.growerBadge}>
          <Text style={styles.growerText}>🌿 Grower Mode</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* WELCOME BANNER */}
        <Text style={[styles.title, { color: theme.text }]}>
          Secure Crop Health,{"\n"}Diagnose Instantly
        </Text>

        {/* SEARCH BAR */}
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
          <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search plant diseases..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        {/* WEEKLY TIPS SLIDER */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly Advice</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tipsSlider}
        >
          {weeklyTips.map((tip) => {
            const Icon = tip.icon;
            return (
              <View 
                key={tip.id} 
                style={[styles.tipCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
              >
                <View style={styles.tipHeader}>
                  <View style={styles.tipIconWrapper}>
                    <Icon size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.tipTag}>{tip.tag}</Text>
                </View>
                <Text style={[styles.tipTitle, { color: theme.text }]}>{tip.title}</Text>
                <Text style={[styles.tipDesc, { color: theme.textSecondary }]}>{tip.desc}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* COMMON DISEASES */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 15 }]}>
          Common Diseases ({filteredDiseases.length})
        </Text>

        {filteredDiseases.length > 0 ? (
          <View style={styles.grid}>
            {filteredDiseases.map((d) => (
              <Pressable
                key={d.key}
                onPress={() =>
                  router.push({
                    pathname: "/result",
                    params: { diseaseKey: d.key },
                  })
                }
                style={[styles.diseaseCard, { backgroundColor: theme.backgroundElement }]}
              >
                <Image source={d.image} style={styles.image} />
                <View style={styles.diseaseContent}>
                  <Text style={[styles.diseaseText, { color: theme.text }]}>{d.title}</Text>
                  <Text style={styles.viewDetailsText}>View Guide →</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={[styles.noResultCard, { backgroundColor: theme.backgroundElement }]}>
            <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
              No diseases found matching "{search}"
            </Text>
          </View>
        )}

      </ScrollView>

      {/* BOTTOM TAB NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.backgroundElement, borderTopColor: theme.backgroundSelected }]}>
        
        <Pressable style={styles.navItem} onPress={() => router.push("/home")}>
          <HomeIcon color="#16A34A" size={24} />
          <Text style={[styles.navText, { color: "#16A34A", fontWeight: "bold" }]}>Home</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/scan")}>
          <View style={styles.cameraNavBtn}>
            <CameraIcon color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.navText}>Scan</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/profile")}>
          <UserIcon color={theme.textSecondary} size={24} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Profile</Text>
        </Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  appName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#16A34A", // Premium Green
    letterSpacing: 0.5,
  },
  growerBadge: {
    backgroundColor: "rgba(22, 163, 74, 0.1)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  growerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#16A34A",
  },
  scroll: {
    padding: 20,
    paddingBottom: 130,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 36,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 16,
    marginBottom: 25,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.02)",
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  tipsSlider: {
    paddingRight: 20,
    paddingBottom: 5,
  },
  tipCard: {
    width: 260,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginRight: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.02)",
      },
    }),
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tipIconWrapper: {
    padding: 6,
    backgroundColor: "rgba(22, 163, 74, 0.1)",
    borderRadius: 8,
    marginRight: 8,
  },
  tipTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
    textTransform: "uppercase",
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tipDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  diseaseCard: {
    width: "48%",
    borderRadius: 20,
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 2px 12px rgba(0, 0, 0, 0.04)",
      },
    }),
  },
  image: {
    width: "100%",
    height: 110,
  },
  diseaseContent: {
    padding: 12,
  },
  diseaseText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 6,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#16A34A",
  },
  noResultCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 95,
    paddingBottom: 25,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: "0px -3px 16px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraNavBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    ...Platform.select({
      ios: {
        shadowColor: "#16A34A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0px 4px 16px rgba(22, 163, 74, 0.3)",
      },
    }),
  },
  navText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    color: "#777",
    fontWeight: "600",
  },
});