import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera, Image as ImageIcon, Upload, RefreshCw, HelpCircle } from "lucide-react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ScanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === "dark" ? "dark" : "light") as keyof typeof Colors;
  const theme = Colors[scheme];

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Scanning laser animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loopAnimation: Animated.CompositeAnimation | null = null;

    if (loading) {
      loopAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false, // Set to false for web compatibility
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      );
      loopAnimation.start();
    } else {
      scanAnim.setValue(0);
    }

    return () => {
      if (loopAnimation) {
        loopAnimation.stop();
      }
    };
  }, [loading]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320], // Stretches viewport height minus line thickness
  });

  // 📷 pick image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 📸 camera
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera permission is required to analyze leaves.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 🤖 analyze with backend or offline fallback
  const analyzePlant = async () => {
    if (!image) return;
    setLoading(true);

    try {
      // Import from dynamically updated modules
      const { predictDisease } = require("@/services/api");
      const { diseases } = require("./home");
      
      const result = await predictDisease(image);

      router.push({
        pathname: "/result",
        params: {
          image,
          prediction: result.prediction,
          confidence: result.confidence.toFixed(1),
          crop: result.crop,
          disease: result.disease,
          cause: result.cause,
          prevention: JSON.stringify(result.prevention),
          imageUrl: result.imageUrl || '',
          isDemo: 'false',
        },
      });

    } catch (e) {
      console.log('[Scan] Server prediction failed, prompt demo mode:', e);
      const { diseases } = require("./home");
      
      Alert.alert(
        "Connection Offline",
        "Could not connect to the AgroScan server. Would you like to run in offline Demo Mode?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Use Demo Mode",
            onPress: () => {
              const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
              router.push({
                pathname: "/result",
                params: {
                  image,
                  prediction: randomDisease.key,
                  confidence: (90 + Math.random() * 9).toFixed(1),
                  crop: randomDisease.title.split(' ')[0],
                  disease: randomDisease.title,
                  cause: randomDisease.cause,
                  prevention: JSON.stringify(randomDisease.prevention),
                  isDemo: 'true',
                },
              });
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Leaf Diagnostics</Text>
        <Pressable style={styles.helpBtn} onPress={() => Alert.alert("How to scan", "Take a clear, focused photo of a single crop leaf. Keep the leaf flat and centered under bright light for maximum classification accuracy.")}>
          <HelpCircle size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      {/* VIEW FINDER / IMAGE PREVIEW */}
      <View style={[styles.previewFrame, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
        {image ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
            {loading && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
            )}
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#FFFFFF" size="large" />
                <Text style={styles.loadingText}>AI Analysing Leaf...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <ImageIcon color="#16A34A" size={42} />
            </View>
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
              No leaf photo selected
            </Text>
            <Text style={[styles.placeholderSubText, { color: theme.textSecondary }]}>
              Import from library or capture a new photo to begin diagnosis
            </Text>
          </View>
        )}
      </View>

      {/* CONTROL BUTTONS */}
      <View style={styles.controlsRow}>
        
        {/* GALLERY */}
        <Pressable 
          style={[styles.circleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]} 
          onPress={pickImage}
          disabled={loading}
        >
          <ImageIcon color="#16A34A" size={24} />
          <Text style={[styles.btnLabel, { color: theme.textSecondary }]}>Library</Text>
        </Pressable>

        {/* ANALYZE / TRIGGER */}
        <Pressable
          style={[
            styles.analyzeBtn, 
            { backgroundColor: image ? "#16A34A" : "rgba(22, 163, 74, 0.4)" }
          ]}
          onPress={analyzePlant}
          disabled={!image || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Upload color="#fff" size={22} />
              <Text style={styles.analyzeText}>Diagnose Leaf</Text>
            </View>
          )}
        </Pressable>

        {/* CAMERA */}
        <Pressable 
          style={[styles.circleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]} 
          onPress={openCamera}
          disabled={loading}
        >
          <Camera color="#16A34A" size={24} />
          <Text style={[styles.btnLabel, { color: theme.textSecondary }]}>Camera</Text>
        </Pressable>

      </View>

      {image && !loading && (
        <Pressable style={styles.resetBtn} onPress={() => setImage(null)}>
          <RefreshCw size={14} color="#EF4444" />
          <Text style={styles.resetText}>Clear Image</Text>
        </Pressable>
      )}

      {/* BOTTOM NAVIGATION */}
      <View style={[styles.bottomNav, { backgroundColor: theme.backgroundElement, borderTopColor: theme.backgroundSelected }]}>
        <Pressable style={styles.navItem} onPress={() => router.push("/home")}>
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Home</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/scan")}>
          <Text style={[styles.navText, { color: "#16A34A", fontWeight: "bold" }]}>
            Camera
          </Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/profile")}>
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Profile</Text>
        </Pressable>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 35,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  helpBtn: {
    padding: 8,
  },
  previewFrame: {
    height: 350,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "bold",
  },
  placeholder: {
    padding: 30,
    alignItems: "center",
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(22, 163, 74, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  placeholderText: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },
  placeholderSubText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 15,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  circleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  btnLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 4,
  },
  analyzeBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  analyzeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    alignSelf: "center",
    marginBottom: 40,
  },
  resetText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "bold",
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