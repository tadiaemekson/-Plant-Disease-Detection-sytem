import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Home, Camera, User, ArrowLeft, Info, Activity, AlertTriangle, ShieldCheck, Pill } from "lucide-react-native";
import { diseases } from "./home";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === "dark" ? "dark" : "light") as keyof typeof Colors;
  const theme = Colors[scheme];

  // Check if we have dynamic scan results from backend or demo fallback
  const hasDynamicPrediction = !!params.prediction;
  
  let imageUri = "";
  let cropName = "";
  let diseaseName = "";
  let confidenceStr = "";
  let causeText = "";
  let preventionSteps: string[] = [];
  let isDemoMode = params.isDemo === "true";

  if (hasDynamicPrediction) {
    imageUri = (params.image as string) || "";
    cropName = (params.crop as string) || "Unknown";
    diseaseName = (params.disease as string) || "Unknown";
    confidenceStr = params.confidence ? `${params.confidence}%` : "95.0%";
    causeText = (params.cause as string) || "Cause information not available.";
    
    try {
      preventionSteps = params.prevention ? JSON.parse(params.prevention as string) : [];
    } catch (e) {
      preventionSteps = params.prevention ? [params.prevention as string] : [];
    }
  } else {
    // Navigated from list of common diseases
    const disease = diseases.find((item) => item.key === params.diseaseKey) ?? diseases[0];
    cropName = disease.title.split(" ")[0];
    diseaseName = disease.title;
    confidenceStr = "Reference Card";
    causeText = disease.cause;
    preventionSteps = disease.prevention;
  }

  // Parse confidence string to percentage number
  const confidenceValue = parseFloat(confidenceStr.replace("%", "")) || 95.0;

  // Find local disease fallback image if uri is empty
  const localDisease = diseases.find((item) => item.key === params.diseaseKey || item.key === params.prediction);
  const fallbackImage = localDisease ? localDisease.image : require("../../assets/images/apple_scab.jpg");

  // Determine health condition color based on prediction key
  const isHealthy = diseaseName.toLowerCase().includes("healthy") || diseaseName.toLowerCase().includes("no disease");
  const statusColor = isHealthy ? "#16A34A" : "#EF4444"; // Green for healthy, Red for disease

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* HEADER BACK BUTTON */}
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}
          onPress={() => router.push("/home")}
        >
          <ArrowLeft size={22} color={theme.text} />
        </Pressable>

        <Text style={[styles.title, { color: theme.text }]}>Diagnosis Report</Text>

        {/* DEMO BANNER */}
        {isDemoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>
              ⚠️ Running in Offline Demo Mode (Mock Prediction)
            </Text>
          </View>
        )}

        {/* LEAF IMAGE VIEWPORT */}
        <View style={styles.imageFrame}>
          <Image 
            source={imageUri ? { uri: imageUri } : fallbackImage} 
            style={styles.image} 
            resizeMode="cover"
          />
          <View style={[styles.statusTag, { backgroundColor: statusColor }]}>
            <Text style={styles.statusTagText}>
              {isHealthy ? "HEALTHY CROP" : "DISEASE DETECTED"}
            </Text>
          </View>
        </View>

        {/* CROP & DIAGNOSIS DETAILS CARD */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.cardHeader}>
            <Info size={18} color="#16A34A" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Plant Diagnostics</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Crop Type</Text>
              <Text style={[styles.value, { color: theme.text }]}>{cropName}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Accuracy Check</Text>
              <Text style={[styles.value, { color: statusColor }]}>{confidenceStr}</Text>
            </View>
          </View>

          {/* CONFIDENCE ACCURACY PROGRESS BAR */}
          {hasDynamicPrediction && (
            <View style={styles.progressSection}>
              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBar, { width: `${confidenceValue}%`, backgroundColor: statusColor }]} />
              </View>
              <Text style={styles.progressLabel}>Model certainty rating: {confidenceStr}</Text>
            </View>
          )}
        </View>

        {/* SPECIFIC DIAGNOSIS */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={18} color="#EF4444" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Condition Name</Text>
          </View>
          <Text style={[styles.value, styles.diseaseName, { color: theme.text }]}>{diseaseName}</Text>
        </View>

        {/* CAUSE */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.cardHeader}>
            <Activity size={18} color="#16A34A" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Cause of Infection</Text>
          </View>
          <Text style={[styles.text, { color: theme.textSecondary }]}>{causeText}</Text>
        </View>

        {/* PREV & TREATMENT CATEGORIZATION */}
        {(() => {
          // Categorize steps
          const prevention: string[] = [];
          const treatment: string[] = [];
          const treatmentKeywords = [
            "apply", "spray", "fungicide", "pesticide", "remove", "prune", "cut", "destroy", 
            "burn", "treat", "copper", "sulfur", "curative", "cure", "control", "insecticide",
            "chemical", "drench", "soap", "oil", "eliminate"
          ];

          preventionSteps.forEach((step) => {
            const lower = step.toLowerCase();
            const isTreatment = treatmentKeywords.some(keyword => lower.includes(keyword));
            if (isTreatment) {
              treatment.push(step);
            } else {
              prevention.push(step);
            }
          });

          return (
            <>
              {/* RECOMMENDED TREATMENTS */}
              <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <Pill size={18} color="#EF4444" />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Recommended Treatments</Text>
                </View>
                {treatment.length > 0 ? (
                  treatment.map((step, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <View style={[styles.bulletPoint, { backgroundColor: "#EF4444" }]} />
                      <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{step}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.text, { color: theme.textSecondary }]}>No immediate curative treatments listed. Focus on prevention.</Text>
                )}
              </View>

              {/* PREVENTION MEASURES */}
              <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <ShieldCheck size={18} color="#16A34A" />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Prevention Measures</Text>
                </View>
                {prevention.length > 0 ? (
                  prevention.map((step, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <View style={[styles.bulletPoint, { backgroundColor: "#16A34A" }]} />
                      <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{step}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.text, { color: theme.textSecondary }]}>No prevention steps listed.</Text>
                )}
              </View>
            </>
          );
        })()}

        {/* SCAN ANOTHER CONTROL */}
        <Pressable
          style={styles.scanButton}
          onPress={() => router.push("/scan")}
        >
          <Text style={styles.scanText}>
            Scan Another Plant
          </Text>
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM TAB BAR */}
      <View style={[styles.bottomNav, { backgroundColor: theme.backgroundElement, borderTopColor: theme.backgroundSelected }]}>
        <Pressable style={styles.navItem} onPress={() => router.push("/home")}>
          <Home size={22} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Home</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/scan")}>
          <Camera size={22} color="#16A34A" />
          <Text style={[styles.navText, { color: "#16A34A", fontWeight: "bold" }]}>Camera</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/profile")}>
          <User size={22} color={theme.textSecondary} />
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
  scroll: {
    padding: 20,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  demoBanner: {
    backgroundColor: "#FFE0B2",
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#FFB74D",
    alignItems: "center",
  },
  demoBannerText: {
    color: "#E65100",
    fontWeight: "bold",
    fontSize: 13,
  },
  imageFrame: {
    width: "100%",
    height: 250,
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
      },
    }),
  },
  image: {
    width: "100%",
    height: "100%",
  },
  statusTag: {
    position: "absolute",
    top: 15,
    right: 15,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
      },
    }),
  },
  statusTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
  },
  diseaseName: {
    fontSize: 20,
    color: "#111",
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  progressSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    paddingTop: 15,
  },
  progressBarWrapper: {
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
    paddingRight: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginTop: 8,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: "#16A34A",
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#16A34A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0px 4px 6px rgba(22, 163, 74, 0.2)",
      },
    }),
  },
  scanText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 95,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingBottom: 25,
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
        boxShadow: "0px -3px 8px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});