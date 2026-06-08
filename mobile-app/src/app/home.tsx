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
  X,
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

const tipDetails: Record<number, {
  id: number;
  title: string;
  tag: string;
  gradient: string[];
  icon: any;
  overview: string;
  sections: { title: string; points: string[] }[];
  botanistTip: string;
}> = {
  1: {
    id: 1,
    title: "Understanding Soil pH",
    tag: "Soil Health",
    gradient: ["#0284C7", "#0369A1"],
    icon: Sprout,
    overview: "Soil pH measures how acidic or alkaline your soil is, on a scale of 0 to 14. A pH level of 7.0 is neutral. Most crops thrive in slightly acidic to neutral soil (pH 6.0–7.0) because nutrients dissolve easily at this range.",
    sections: [
      {
        title: "Why Soil pH Matters",
        points: [
          "Nutrient Lockout: In highly acidic (below 5.5) or alkaline (above 7.5) soils, essential nutrients like phosphorus, iron, and magnesium bind tightly to soil particles, preventing root absorption.",
          "Microbial Activity: Beneficial soil bacteria and fungi that decompose organic matter thrive in a neutral pH range.",
          "Root Development: Acidic soils can leach toxic aluminum into the root zone, pruning and damaging root tips."
        ]
      },
      {
        title: "Typical Crop Preferences",
        points: [
          "Slightly Acidic (6.0 - 6.5): Potatoes, Blueberries, Tomatoes, and Peppers.",
          "Neutral (6.5 - 7.0): Corn, Grapes, Squash, Spinach, and Beans.",
          "Alkaline Tolerate (7.0 - 7.5): Cabbage, Cauliflower, and Asparagus."
        ]
      },
      {
        title: "How to Correct Your Soil pH",
        points: [
          "To Raise pH (if too acidic): Apply Agricultural Lime (calcium carbonate) or wood ash. Lime adds calcium and neutralizes soil acids.",
          "To Lower pH (if too alkaline): Add Elemental Sulfur, aluminum sulfate, or peat moss. Sulfur slowly converts to acid through soil bacteria.",
          "Organic Matter: Consistently adding compost buffers soil pH, keeping it stable over time."
        ]
      }
    ],
    botanistTip: "Always run a proper soil test before amending. Adding too much lime or sulfur can cause severe nutrient imbalances that take years to resolve."
  },
  2: {
    id: 2,
    title: "Early Blight Prevention",
    tag: "Disease Prevention",
    gradient: ["#EA580C", "#C2410C"],
    icon: BookOpen,
    overview: "Early Blight is a destructive fungal infection caused by Alternaria solani. It targets tomato, potato, and eggplant families, overwintering in crop debris and splashing up from the soil during warm, wet weather.",
    sections: [
      {
        title: "Symptoms to Watch For",
        points: [
          "Target Spotting: Brown to black spots with concentric target-like rings appear on older lower leaves first.",
          "Yellow Halos: Leaves surrounding the black target spots turn yellow and eventually drop off.",
          "Stem & Fruit Lesions: Dark, sunken lesions form near the soil line on stems and on the shoulder of fruits."
        ]
      },
      {
        title: "Cultural Prevention Checklist",
        points: [
          "Bottom-Only Watering: Direct water to the base of the plant using drip tape or a soaker hose. Fungal spores require leaf wetness to germinate.",
          "Mulching: Cover the soil under your crops with straw, leaves, or plastic sheeting. This blocks spores from splashing onto lower foliage.",
          "Lower Pruning: Trim off branches within 12 inches of the soil. This prevents leaves from touching the soil and increases lower air circulation."
        ]
      },
      {
        title: "Organic Management",
        points: [
          "Crop Rotation: Wait 2-3 years before planting nightshades (tomatoes, potatoes) in the same soil patch.",
          "Copper Sprays: Apply organic liquid copper fungicides preventively when humidity is high or at the first sign of lower leaf spots."
        ]
      }
    ],
    botanistTip: "Rake up and destroy (do not compost) all infected nightshade foliage at the end of the season. Composting does not always get hot enough to kill Alternaria spores."
  },
  3: {
    id: 3,
    title: "Crop Rotation Guide",
    tag: "Best Practices",
    gradient: ["#16A34A", "#15803D"],
    icon: Compass,
    overview: "Crop rotation is the practice of growing different crop families in the same area across sequential seasons. This prevents soil-borne pathogens from building up, balances nutrient depletion, and optimizes soil structure.",
    sections: [
      {
        title: "The Four Core Families",
        points: [
          "Nightshades (Solanaceae): Tomatoes, Potatoes, Peppers, Eggplants. Heavy feeders that exhaust nitrogen and harbor blights.",
          "Legumes (Fabaceae): Beans, Peas, Clover. Nitrogen-fixing plants that restore soil fertility by taking nitrogen from the air.",
          "Crucifers (Brassicaceae): Cabbage, Broccoli, Kale, Radish. Moderate feeders that benefit from clean, nitrogen-rich soil.",
          "Alliums / Roots (Amaryllidaceae/Apiaceae): Onions, Garlic, Carrots. Light feeders that loosen the soil structure."
        ]
      },
      {
        title: "Rotation Sequence Rule",
        points: [
          "Follow Heavy Feeders (Nightshades) with Nitrogen Builders (Legumes) to replenish the soil.",
          "Follow Legumes with Moderate Feeders (Crucifers) to utilize the freshly fixed nitrogen.",
          "Follow Crucifers with Light Feeders (Roots/Alliums) to scavenge residual nutrients before restarting the cycle."
        ]
      },
      {
        title: "Benefits of Rotation",
        points: [
          "Disease Suppression: Spores of blights, wilts, and root rot die out if their host family is absent for 2-3 years.",
          "Pest Disruption: Breaks the life cycle of overwintering insects like Colorado potato beetles.",
          "Nutrient Balance: Different root depths and nutrient needs prevent mineral depletion at specific soil zones."
        ]
      }
    ],
    botanistTip: "Maintain a simple garden map journal. It is easy to forget where nightshades were planted two years ago, especially in small backyard gardens."
  }
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedTip, setSelectedTip] = useState<any | null>(null);
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
              <Pressable 
                key={tip.id} 
                style={[styles.tipCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                onPress={() => setSelectedTip(tipDetails[tip.id])}
              >
                <View style={styles.tipHeader}>
                  <View style={styles.tipIconWrapper}>
                    <Icon size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.tipTag}>{tip.tag}</Text>
                </View>
                <Text style={[styles.tipTitle, { color: theme.text }]}>{tip.title}</Text>
                <Text style={[styles.tipDesc, { color: theme.textSecondary }]}>{tip.desc}</Text>
              </Pressable>
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

      {/* DETAILED ADVICE OVERLAY MODAL */}
      {selectedTip ? (
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.65)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
            
            {/* Modal Header */}
            <View style={[styles.modalHeader, { backgroundColor: selectedTip.gradient[0] }]}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIconBg}>
                  {React.createElement(selectedTip.icon, { size: 22, color: "#FFFFFF" })}
                </View>
                <View>
                  <Text style={styles.modalHeaderTag}>{selectedTip.tag}</Text>
                  <Text style={styles.modalHeaderTitle}>{selectedTip.title}</Text>
                </View>
              </View>
              <Pressable style={styles.modalCloseIcon} onPress={() => setSelectedTip(null)}>
                <X color="#FFFFFF" size={20} />
              </Pressable>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalOverviewText, { color: theme.text }]}>
                {selectedTip.overview}
              </Text>

              {selectedTip.sections.map((section: any, sIdx: number) => (
                <View key={sIdx} style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.text }]}>{section.title}</Text>
                  {section.points.map((point: string, pIdx: number) => (
                    <View key={pIdx} style={styles.modalPointRow}>
                      <View style={styles.modalPointBullet} />
                      <Text style={[styles.modalPointText, { color: theme.textSecondary }]}>{point}</Text>
                    </View>
                  ))}
                </View>
              ))}

              {/* Botanist Tip */}
              <View style={styles.botanistTipCard}>
                <Text style={styles.botanistTipLabel}>🌿 BOTANIST ADVICE</Text>
                <Text style={styles.botanistTipText}>{selectedTip.botanistTip}</Text>
              </View>
            </ScrollView>

            {/* Close Button */}
            <Pressable style={styles.modalCloseButton} onPress={() => setSelectedTip(null)}>
              <Text style={styles.modalCloseButtonText}>Close Guide</Text>
            </Pressable>

          </View>
        </View>
      ) : null}

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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalHeaderIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderTag: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 2,
  },
  modalCloseIcon: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  modalBody: {
    padding: 20,
  },
  modalOverviewText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalPointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingRight: 10,
  },
  modalPointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginTop: 7,
    marginRight: 10,
  },
  modalPointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  botanistTipCard: {
    backgroundColor: "rgba(22, 163, 74, 0.06)",
    borderColor: "rgba(22, 163, 74, 0.15)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  botanistTipLabel: {
    color: "#16A34A",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  botanistTipText: {
    color: "#15803D",
    fontSize: 13,
    lineHeight: 18,
  },
  modalCloseButton: {
    backgroundColor: "#16A34A",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});