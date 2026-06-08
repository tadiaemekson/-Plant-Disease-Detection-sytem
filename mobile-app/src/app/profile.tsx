import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
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
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Lock,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Info,
  Eye,
  Activity
} from "lucide-react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/services/authContext";
import {
  getFarms,
  addFarm,
  deleteFarm,
  submitSupportTicket,
  getUserScans,
  updateSettings,
} from "@/services/api";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading, login, register, logout, updateLocalUsername, setPremiumStatus, updateProfilePic } = useAuth();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === "dark" ? "dark" : "light") as keyof typeof Colors;
  const theme = Colors[scheme];

  // Auth View State
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authLoadingState, setAuthLoadingState] = useState(false);
  const [authError, setAuthError] = useState("");

  // Profile Active Section State
  // Values: null, 'farms', 'history', 'premium', 'settings', 'notifications', 'support'
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Farms Section States
  const [farmsList, setFarmsList] = useState<any[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(false);
  const [showAddFarmForm, setShowAddFarmForm] = useState(false);
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmCrop, setNewFarmCrop] = useState("");
  const [newFarmSize, setNewFarmSize] = useState("");
  const [farmActionLoading, setFarmActionLoading] = useState(false);

  // Scan History Section States
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedScanDetail, setSelectedScanDetail] = useState<any | null>(null);

  // Premium Section States
  const [premiumActionLoading, setPremiumActionLoading] = useState(false);

  // Settings Section States
  const [settingsUsername, setSettingsUsername] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState("");
  const [settingsActionLoading, setSettingsActionLoading] = useState(false);

  // Notifications Section States
  const [notifWeather, setNotifWeather] = useState(true);
  const [notifOutbreak, setNotifOutbreak] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);
  const mockNotifications = [
    {
      id: "1",
      title: "Elevated Humidity Warning 🌧️",
      body: "Relative humidity is at 88% in your tomato orchard area. Moderate threat for Leaf Mold. Maintain canopy ventilation.",
      time: "2 hours ago",
      type: "warning",
    },
    {
      id: "2",
      title: "Late Blight Alert ⚠️",
      body: "Outbreaks of Late Blight reported in neighboring county farms. Recommended to inspect Potato crops and apply preventive sprays.",
      time: "1 day ago",
      type: "danger",
    },
    {
      id: "3",
      title: "Weekly Cultivation Digest 🌿",
      body: "Great job! You logged 3 healthy scans this week. Crop health score is 96%. Keep scanning to monitor progress.",
      time: "3 days ago",
      type: "info",
    },
  ];

  // Support Section States
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportActionLoading, setSupportActionLoading] = useState(false);

  // Sync settings and load lists when user logs in
  useEffect(() => {
    if (user) {
      setSettingsUsername(user.username);
      // Load initial lists for main profile and sub-sections in background
      loadHistoryData();
      loadFarmsData();
    } else {
      setHistoryList([]);
      setFarmsList([]);
    }
  }, [user]);

  // Support section-specific re-fetching
  useEffect(() => {
    if (user) {
      if (activeSection === "farms") {
        loadFarmsData();
      } else if (activeSection === "history") {
        loadHistoryData();
      }
    }
  }, [activeSection]);

  const loadFarmsData = async () => {
    if (!user) return;
    setFarmsLoading(true);
    try {
      const data = await getFarms(user.id);
      setFarmsList(data);
    } catch (err) {
      console.error("Error loading farms:", err);
      Alert.alert("Error", "Could not load farm records.");
    } finally {
      setFarmsLoading(false);
    }
  };

  const loadHistoryData = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const data = await getUserScans(user.id);
      setHistoryList(data);
    } catch (err) {
      console.error("Error loading scan logs:", err);
      Alert.alert("Error", "Could not load scan logs from database.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // --- Auth Handlers ---
  const handleAuthSubmit = async () => {
    setAuthError("");
    if (!authEmail || !authPassword) {
      setAuthError("Please fill out all credentials.");
      return;
    }
    if (!isLoginTab && !authUsername) {
      setAuthError("Display name is required for registration.");
      return;
    }

    setAuthLoadingState(true);
    try {
      if (isLoginTab) {
        await login(authEmail, authPassword);
      } else {
        await register(authUsername, authEmail, authPassword);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Try again.");
    } finally {
      setAuthLoadingState(false);
    }
  };

  // --- Farms Handlers ---
  const handleCreateFarm = async () => {
    if (!user) return;
    if (!newFarmName || !newFarmCrop || !newFarmSize) {
      Alert.alert("Missing Fields", "Please specify farm name, crop type and area size.");
      return;
    }
    setFarmActionLoading(true);
    try {
      await addFarm(user.id, newFarmName, newFarmCrop, newFarmSize);
      setNewFarmName("");
      setNewFarmCrop("");
      setNewFarmSize("");
      setShowAddFarmForm(false);
      loadFarmsData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to register farm.");
    } finally {
      setFarmActionLoading(false);
    }
  };

  const handleDeleteFarm = async (farmId: string) => {
    Alert.alert(
      "Remove Farm",
      "Are you sure you want to delete this farm location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFarm(farmId);
              loadFarmsData();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove farm.");
            }
          },
        },
      ]
    );
  };

  // --- Settings Handlers ---
  const handleUpdateSettings = async () => {
    if (!user) return;
    if (!settingsUsername) {
      Alert.alert("Error", "Username is required.");
      return;
    }
    if (settingsPassword && settingsPassword !== settingsConfirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setSettingsActionLoading(true);
    try {
      await updateSettings(user.id, settingsUsername, settingsPassword || undefined);
      updateLocalUsername(settingsUsername);
      setSettingsPassword("");
      setSettingsConfirmPassword("");
      Alert.alert("Success", "Account details updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile details.");
    } finally {
      setSettingsActionLoading(false);
    }
  };

  // --- Premium Upgrade Handlers ---
  const handleUpgradePremium = () => {
    setPremiumActionLoading(true);
    setTimeout(() => {
      setPremiumActionLoading(false);
      setPremiumStatus(true);
      Alert.alert(
        "Upgrade Successful! 👑",
        "Welcome to AgroScan Premium! Your Cultivator Status has been elevated to Premium Grower.",
        [{ text: "Awesome!" }]
      );
    }, 1500);
  };

  const handleDowngradePremium = () => {
    setPremiumStatus(false);
    Alert.alert("Downgraded", "Your account has been set back to the free subscription tier.", [
      { text: "OK" },
    ]);
  };

  // --- Support Handler ---
  const handleSupportSubmit = async () => {
    if (!supportSubject || !supportMessage) {
      Alert.alert("Validation Error", "Please fill in both subject and message.");
      return;
    }
    setSupportActionLoading(true);
    try {
      await submitSupportTicket(user ? user.id : null, supportSubject, supportMessage);
      setSupportSubject("");
      setSupportMessage("");
      Alert.alert(
        "Support Ticket Logged",
        "We have received your farming ticket. Our support botanists will review it shortly!",
        [{ text: "OK" }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not log support ticket.");
    } finally {
      setSupportActionLoading(false);
    }
  };

  // --- Change Profile Picture ---
  const handleUpdateAvatar = async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Needed", "We need media library permission to let you select a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      updateProfilePic(selectedUri);
    }
  };

  // -------------------------------------------------------------
  // Views Rendering
  // -------------------------------------------------------------

  if (authLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color="#16A34A" size="large" />
      </View>
    );
  }

  // --- 1. Logged Out Auth View ---
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authHeaderBlock}>
            <View style={styles.authLogoCircle}>
              <Sparkles color="#16A34A" size={28} />
            </View>
            <Text style={[styles.authTitle, { color: theme.text }]}>AgroScan Portal</Text>
            <Text style={[styles.authSubtitle, { color: theme.textSecondary }]}>
              Join over 10,000+ growers protecting crops using AI
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.authCard, { backgroundColor: theme.backgroundElement }]}>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <Pressable
                style={[styles.tabButton, isLoginTab && styles.activeTabButton]}
                onPress={() => {
                  setIsLoginTab(true);
                  setAuthError("");
                }}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: isLoginTab ? "#16A34A" : theme.textSecondary },
                    isLoginTab && styles.activeTabButtonText,
                  ]}
                >
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabButton, !isLoginTab && styles.activeTabButton]}
                onPress={() => {
                  setIsLoginTab(false);
                  setAuthError("");
                }}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: !isLoginTab ? "#16A34A" : theme.textSecondary },
                    !isLoginTab && styles.activeTabButtonText,
                  ]}
                >
                  Create Account
                </Text>
              </Pressable>
            </View>

            {authError ? (
              <View style={styles.errorBanner}>
                <AlertTriangle color="#EF4444" size={16} />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            {/* Inputs */}
            <View style={styles.formInputs}>
              {!isLoginTab ? (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Display Name</Text>
                  <View style={[styles.inputWrapper, { borderColor: theme.backgroundSelected }]}>
                    <User color={theme.textSecondary} size={18} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="e.g. Grower John"
                      placeholderTextColor={theme.textSecondary}
                      value={authUsername}
                      onChangeText={setAuthUsername}
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.backgroundSelected }]}>
                  <Mail color={theme.textSecondary} size={18} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="grower@agroscan.ai"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={authEmail}
                    onChangeText={setAuthEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.backgroundSelected }]}>
                  <Lock color={theme.textSecondary} size={18} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    value={authPassword}
                    onChangeText={setAuthPassword}
                  />
                </View>
              </View>
            </View>

            <Pressable
              style={styles.authSubmitBtn}
              onPress={handleAuthSubmit}
              disabled={authLoadingState}
            >
              {authLoadingState ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.authSubmitBtnText}>
                  {isLoginTab ? "Verify Credentials" : "Register Account"}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- 2. Interactive Sections (Subviews) ---

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Pressable style={styles.sectionBackBtn} onPress={() => setActiveSection(null)}>
        <ArrowLeft color={theme.text} size={20} />
      </Pressable>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // SUBVIEW: Farms & Crops
  if (activeSection === "farms") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderSectionHeader("My Farms & Crops")}

        <ScrollView contentContainerStyle={styles.sectionScroll}>
          {showAddFarmForm ? (
            <View style={[styles.cardForm, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>Register Farm Location</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Farm / Location Name</Text>
                <TextInput
                  style={[styles.formInputText, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  placeholder="e.g. Greenhouse Beta, Vineyard Hill"
                  placeholderTextColor={theme.textSecondary}
                  value={newFarmName}
                  onChangeText={setNewFarmName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Primary Crop Type</Text>
                <TextInput
                  style={[styles.formInputText, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  placeholder="e.g. Tomato, Potato, Apple, Grape"
                  placeholderTextColor={theme.textSecondary}
                  value={newFarmCrop}
                  onChangeText={setNewFarmCrop}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Area Size / Description</Text>
                <TextInput
                  style={[styles.formInputText, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  placeholder="e.g. 2.5 Acres, 400 Sqm"
                  placeholderTextColor={theme.textSecondary}
                  value={newFarmSize}
                  onChangeText={setNewFarmSize}
                />
              </View>

              <View style={styles.formButtons}>
                <Pressable
                  style={[styles.formBtn, styles.cancelBtn, { borderColor: theme.backgroundSelected }]}
                  onPress={() => setShowAddFarmForm(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.formBtn, styles.submitBtn]}
                  onPress={handleCreateFarm}
                  disabled={farmActionLoading}
                >
                  {farmActionLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Add Farm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.addFarmTrigger}
              onPress={() => setShowAddFarmForm(true)}
            >
              <Plus color="#16A34A" size={20} />
              <Text style={styles.addFarmTriggerText}>Register New Farm</Text>
            </Pressable>
          )}

          {farmsLoading ? (
            <ActivityIndicator color="#16A34A" size="large" style={{ marginTop: 40 }} />
          ) : farmsList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No farm locations registered yet. Add your fields to track crop diagnoses effectively!
              </Text>
            </View>
          ) : (
            <View style={styles.farmsContainer}>
              {farmsList.map((farm) => (
                <View
                  key={farm.id}
                  style={[styles.farmCard, { backgroundColor: theme.backgroundElement }]}
                >
                  <View style={styles.farmDetails}>
                    <Text style={[styles.farmName, { color: theme.text }]}>{farm.name}</Text>
                    <View style={styles.farmMeta}>
                      <View style={styles.farmBadge}>
                        <Text style={styles.farmBadgeText}>{farm.crop_type}</Text>
                      </View>
                      <Text style={[styles.farmSize, { color: theme.textSecondary }]}>
                        {farm.area_size}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.deleteFarmBtn}
                    onPress={() => handleDeleteFarm(farm.id)}
                  >
                    <Trash2 color="#EF4444" size={18} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // SUBVIEW: Scan History Logs
  if (activeSection === "history") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderSectionHeader("Scan History Logs")}

        <ScrollView contentContainerStyle={styles.sectionScroll}>
          {historyLoading ? (
            <ActivityIndicator color="#16A34A" size="large" style={{ marginTop: 40 }} />
          ) : historyList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No historical scans recorded on this profile. Scan a leaf from the camera tab to log results.
              </Text>
            </View>
          ) : (
            <View style={styles.historyContainer}>
              {historyList.map((scan) => {
                const isHealthy = scan.disease_name?.toLowerCase().includes("healthy");
                return (
                  <View
                    key={scan.id}
                    style={[styles.historyCard, { backgroundColor: theme.backgroundElement }]}
                  >
                    {scan.image_path ? (
                      <Image source={{ uri: scan.image_path }} style={styles.historyThumb} />
                    ) : (
                      <View style={[styles.historyThumbPlace, { backgroundColor: theme.backgroundSelected }]}>
                        <Activity color={theme.textSecondary} size={16} />
                      </View>
                    )}

                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyCrop, { color: theme.text }]}>
                        {scan.crop_type}
                      </Text>
                      <Text
                        style={[
                          styles.historyDisease,
                          { color: isHealthy ? "#16A34A" : "#DC2626" },
                        ]}
                      >
                        {scan.disease_name || "Scanning Leaf"}
                      </Text>
                      <Text style={[styles.historyTime, { color: theme.textSecondary }]}>
                        {scan.confidence ? `${scan.confidence}% Confidence` : ""} •{" "}
                        {new Date(scan.created_at).toLocaleDateString()}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.historyViewBtn}
                      onPress={() => setSelectedScanDetail(scan)}
                    >
                      <Eye color="#16A34A" size={18} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Scan Detail Modal Overlay */}
        {selectedScanDetail ? (
          <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Historical Diagnosis</Text>

              <ScrollView style={{ width: "100%", marginBottom: 15 }} showsVerticalScrollIndicator={false}>
                {selectedScanDetail.image_path ? (
                  <Image source={{ uri: selectedScanDetail.image_path }} style={styles.modalImage} />
                ) : null}

                <View style={styles.modalMeta}>
                  {/* CROP & DIAGNOSIS DETAILS */}
                  <View style={[styles.card, { backgroundColor: theme.background, padding: 12, borderRadius: 16, marginBottom: 12 }]}>
                    <Text style={styles.label}>Plant Diagnostics</Text>
                    <Text style={[styles.modalCrop, { color: theme.textSecondary, marginTop: 4 }]}>
                      Crop Type: <Text style={{ color: theme.text, fontWeight: "bold" }}>{selectedScanDetail.crop_type}</Text>
                    </Text>
                    <Text style={[styles.modalConfidence, { color: theme.textSecondary, marginTop: 4 }]}>
                      Accuracy: <Text style={{ color: theme.text, fontWeight: "bold" }}>{selectedScanDetail.confidence}%</Text>
                    </Text>
                    <Text style={[styles.modalDate, { color: theme.textSecondary, marginTop: 4 }]}>
                      Scanned: <Text style={{ color: theme.text, fontWeight: "bold" }}>{new Date(selectedScanDetail.created_at).toLocaleString()}</Text>
                    </Text>
                  </View>

                  {/* CONDITION NAME */}
                  <View style={[styles.card, { backgroundColor: theme.background, padding: 12, borderRadius: 16, marginBottom: 12 }]}>
                    <Text style={styles.label}>Condition Name</Text>
                    <Text style={[styles.modalDisease, { color: selectedScanDetail.disease_name?.toLowerCase().includes("healthy") ? "#16A34A" : "#DC2626", marginTop: 4 }]}>
                      {selectedScanDetail.disease_name}
                    </Text>
                  </View>

                  {/* CAUSE */}
                  <View style={[styles.card, { backgroundColor: theme.background, padding: 12, borderRadius: 16, marginBottom: 12 }]}>
                    <Text style={styles.label}>Cause of Infection</Text>
                    <Text style={[styles.text, { color: theme.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }]}>
                      {selectedScanDetail.cause || "No cause details logged."}
                    </Text>
                  </View>

                  {/* TREATMENT & PREVENTION */}
                  {(() => {
                    const prevention: string[] = [];
                    const treatment: string[] = [];
                    const treatmentKeywords = [
                      "apply", "spray", "fungicide", "pesticide", "remove", "prune", "cut", "destroy", 
                      "burn", "treat", "copper", "sulfur", "curative", "cure", "control", "insecticide",
                      "chemical", "drench", "soap", "oil", "eliminate"
                    ];

                    const steps = selectedScanDetail.prevention_steps || [];
                    steps.forEach((step: string) => {
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
                        <View style={[styles.card, { backgroundColor: theme.background, padding: 12, borderRadius: 16, marginBottom: 12 }]}>
                          <Text style={[styles.label, { color: "#EF4444" }]}>Recommended Treatments</Text>
                          {treatment.length > 0 ? (
                            treatment.map((step, idx) => (
                              <View key={idx} style={styles.bulletRow}>
                                <View style={[styles.bulletPoint, { backgroundColor: "#EF4444", width: 4, height: 4, borderRadius: 2, marginTop: 6 }]} />
                                <Text style={[styles.bulletText, { color: theme.textSecondary, fontSize: 13, lineHeight: 18 }]}>{step}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={[styles.text, { color: theme.textSecondary, fontSize: 13, marginTop: 4 }]}>No immediate curative treatments listed. Focus on prevention.</Text>
                          )}
                        </View>

                        <View style={[styles.card, { backgroundColor: theme.background, padding: 12, borderRadius: 16, marginBottom: 12 }]}>
                          <Text style={[styles.label, { color: "#16A34A" }]}>Prevention Measures</Text>
                          {prevention.length > 0 ? (
                            prevention.map((step, idx) => (
                              <View key={idx} style={styles.bulletRow}>
                                <View style={[styles.bulletPoint, { backgroundColor: "#16A34A", width: 4, height: 4, borderRadius: 2, marginTop: 6 }]} />
                                <Text style={[styles.bulletText, { color: theme.textSecondary, fontSize: 13, lineHeight: 18 }]}>{step}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={[styles.text, { color: theme.textSecondary, fontSize: 13, marginTop: 4 }]}>No prevention steps listed.</Text>
                          )}
                        </View>
                      </>
                    );
                  })()}
                </View>
              </ScrollView>

              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setSelectedScanDetail(null)}
              >
                <Text style={styles.modalCloseBtnText}>Close Details</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  // SUBVIEW: Premium License
  if (activeSection === "premium") {
    const isPremium = !!user?.isPremium;
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderSectionHeader("Premium License")}

        <ScrollView contentContainerStyle={styles.sectionScroll}>
          <View style={[styles.premiumBanner, { backgroundColor: isPremium ? "#FDF2F8" : "#F0FDF4" }]}>
            <View style={[styles.premiumCrown, { backgroundColor: isPremium ? "#FBCFE8" : "#DCFCE7" }]}>
              <Sparkles color={isPremium ? "#DB2777" : "#16A34A"} size={36} />
            </View>
            <Text style={[styles.premiumStatusTitle, { color: theme.text }]}>
              Account Tier: {isPremium ? "Premium Grower 👑" : "AgroScan Free 🌿"}
            </Text>
            <Text style={[styles.premiumStatusSubtitle, { color: theme.textSecondary }]}>
              {isPremium
                ? "You have unlocked complete botanical reports and unlimited farm tracking."
                : "Upgrade to premium to access farm dashboard widgets and export reports."}
            </Text>
          </View>

          <View style={styles.benefitsGrid}>
            <Text style={[styles.benefitsHeader, { color: theme.text }]}>Subscription Features</Text>

            <View style={[styles.benefitRow, { borderBottomColor: theme.backgroundSelected }]}>
              <CheckCircle2 color="#16A34A" size={18} />
              <View style={styles.benefitTextGroup}>
                <Text style={[styles.benefitTitle, { color: theme.text }]}>AI Leaf Diagnoses</Text>
                <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                  Unlimited instant classifications for 38 leaf disease keys.
                </Text>
              </View>
            </View>

            <View style={[styles.benefitRow, { borderBottomColor: theme.backgroundSelected }]}>
              <CheckCircle2 color="#16A34A" size={18} />
              <View style={styles.benefitTextGroup}>
                <Text style={[styles.benefitTitle, { color: theme.text }]}>Multi-Farm CRUD</Text>
                <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                  Register acreage fields, tracking crops and pest outbreaks.
                </Text>
              </View>
            </View>

            <View style={[styles.benefitRow, { borderBottomColor: theme.backgroundSelected }]}>
              <CheckCircle2 color={isPremium ? "#16A34A" : theme.textSecondary} size={18} />
              <View style={styles.benefitTextGroup}>
                <Text style={[styles.benefitTitle, { color: theme.text }]}>Outbreak Risk Digests (Premium)</Text>
                <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                  Receive localized alarms regarding pest spread forecasts.
                </Text>
              </View>
            </View>
          </View>

          {isPremium ? (
            <Pressable
              style={[styles.premiumUpgradeBtn, { backgroundColor: "#EF4444" }]}
              onPress={handleDowngradePremium}
            >
              <Text style={styles.premiumUpgradeText}>Downgrade to Free Tier</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.premiumUpgradeBtn}
              onPress={handleUpgradePremium}
              disabled={premiumActionLoading}
            >
              {premiumActionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.premiumUpgradeText}>Upgrade to Premium ($9.99/mo)</Text>
                </>
              )}
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  // SUBVIEW: Account Settings
  if (activeSection === "settings") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderSectionHeader("Account Settings")}

        <ScrollView contentContainerStyle={styles.sectionScroll}>
          <View style={[styles.cardForm, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>Profile Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Display Name / Grower Nickname</Text>
              <TextInput
                style={[styles.formInputText, { color: theme.text, borderColor: theme.backgroundSelected }]}
                value={settingsUsername}
                onChangeText={setSettingsUsername}
              />
            </View>

            <Text style={[styles.formTitle, { color: theme.text, marginTop: 25 }]}>Change Password</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>New Password</Text>
              <TextInput
                style={[styles.formInputText, { color: theme.text, borderColor: theme.backgroundSelected }]}
                placeholder="Leave blank to keep current"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={settingsPassword}
                onChangeText={setSettingsPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm New Password</Text>
              <TextInput
                style={[styles.formInputText, { color: theme.text, borderColor: theme.backgroundSelected }]}
                placeholder="Confirm password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={settingsConfirmPassword}
                onChangeText={setSettingsConfirmPassword}
              />
            </View>

            <Pressable
              style={[styles.authSubmitBtn, { marginTop: 20 }]}
              onPress={handleUpdateSettings}
              disabled={settingsActionLoading}
            >
              {settingsActionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.authSubmitBtnText}>Save Account Changes</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // SUBVIEW: Farming Notifications
  if (activeSection === "notifications") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderSectionHeader("Farming Notifications")}

        <ScrollView contentContainerStyle={styles.sectionScroll}>
          <View style={[styles.cardForm, { backgroundColor: theme.backgroundElement, paddingVertical: 10 }]}>
            <View style={[styles.toggleRow, { borderBottomColor: theme.backgroundSelected }]}>
              <View style={styles.toggleTextGroup}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>Weather Alerts</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  High humidity or frost alarms.
                </Text>
              </View>
              <Switch value={notifWeather} onValueChange={setNotifWeather} thumbColor="#16A34A" />
            </View>

            <View style={[styles.toggleRow, { borderBottomColor: theme.backgroundSelected }]}>
              <View style={styles.toggleTextGroup}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>Disease Outbreak Alerts</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  Pest outbreaks registered near your county.
                </Text>
              </View>
              <Switch value={notifOutbreak} onValueChange={setNotifOutbreak} thumbColor="#16A34A" />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>Weekly Digest</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  Receive custom summary graphs.
                </Text>
              </View>
              <Switch value={notifDigest} onValueChange={setNotifDigest} thumbColor="#16A34A" />
            </View>
          </View>

          <Text style={[styles.benefitsHeader, { color: theme.text, marginTop: 25 }]}>Alert History</Text>
          <View style={styles.alertFeed}>
            {mockNotifications.map((n) => (
              <View
                key={n.id}
                style={[styles.alertCard, { backgroundColor: theme.backgroundElement }]}
              >
                <View style={styles.alertCardHeader}>
                  <Text style={[styles.alertCardTitle, { color: theme.text }]}>{n.title}</Text>
                  <Text style={[styles.alertCardTime, { color: theme.textSecondary }]}>{n.time}</Text>
                </View>
                <Text style={[styles.alertCardBody, { color: theme.textSecondary }]}>{n.body}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // SUBVIEW: AgroScan Support
  if (activeSection === "support") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderSectionHeader("AgroScan Support")}

        <ScrollView contentContainerStyle={styles.sectionScroll}>
          <View style={[styles.cardForm, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>Botanical & App Support</Text>
            <Text style={[styles.supportSubtitle, { color: theme.textSecondary }]}>
              Submit a support ticket. Our team of agronomists and developers will get back to you within 24 hours.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Subject / Topic</Text>
              <TextInput
                style={[styles.formInputText, { color: theme.text, borderColor: theme.backgroundSelected }]}
                placeholder="e.g. Tomato Leaf mold help, App sync error"
                placeholderTextColor={theme.textSecondary}
                value={supportSubject}
                onChangeText={setSupportSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Message / Explanation</Text>
              <TextInput
                style={[
                  styles.formInputText,
                  styles.formTextArea,
                  { color: theme.text, borderColor: theme.backgroundSelected },
                ]}
                placeholder="Describe your issue or query in detail..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={6}
                value={supportMessage}
                onChangeText={setSupportMessage}
              />
            </View>

            <Pressable
              style={styles.authSubmitBtn}
              onPress={handleSupportSubmit}
              disabled={supportActionLoading}
            >
              {supportActionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.authSubmitBtnText}>Submit Support Request</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- 3. Default Logged In Profile Menu View ---

  const growerBadge = user.isPremium ? "Premium Grower 👑" : "Free Cultivator 🌿";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Farmer Profile</Text>

        {/* Profile Card */}
        <View style={[styles.headerCard, { backgroundColor: theme.backgroundElement }]}>
          <Pressable style={styles.avatarWrapper} onPress={handleUpdateAvatar}>
            <Image
              source={user.profilePic ? { uri: user.profilePic } : {
                uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
              }}
              style={styles.avatar}
            />
            <View style={styles.cameraIcon}>
              <Camera color="#fff" size={14} />
            </View>
          </Pressable>

          <Text style={[styles.name, { color: theme.text }]}>{user.username}</Text>
          <View style={[styles.badge, { backgroundColor: user.isPremium ? "#FDF2F8" : "rgba(22, 163, 74, 0.1)" }]}>
            <Text style={[styles.badgeText, { color: user.isPremium ? "#DB2777" : "#16A34A" }]}>
              {growerBadge}
            </Text>
          </View>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user.email}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          {[
            {
              icon: User,
              label: "My Farms & Crops",
              color: "#16A34A",
              section: "farms",
            },
            {
              icon: History,
              label: "Scan History Logs",
              color: "#16A34A",
              section: "history",
            },
            {
              icon: ShieldCheck,
              label: "Premium License",
              color: "#F59E0B",
              section: "premium",
            },
            {
              icon: Settings,
              label: "Account Settings",
              color: "#64748B",
              section: "settings",
            },
            {
              icon: Bell,
              label: "Farming Notifications",
              color: "#64748B",
              section: "notifications",
            },
            {
              icon: HelpCircle,
              label: "AgroScan Support",
              color: "#64748B",
              section: "support",
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={index}
                style={[styles.menuItem, { backgroundColor: theme.backgroundElement }]}
                android_ripple={{ color: theme.backgroundSelected }}
                onPress={() => setActiveSection(item.section)}
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

        {/* Logout */}
        <Pressable
          style={[styles.logout, { backgroundColor: theme.backgroundElement }]}
          onPress={logout}
        >
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Log Out Session</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom Nav */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.backgroundElement,
            borderTopColor: theme.backgroundSelected,
          },
        ]}
      >
        <Pressable style={styles.navItem} onPress={() => router.push("/home")}>
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Home</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push("/scan")}>
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Camera</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push("/profile")}>
          <Text style={[styles.navText, { color: "#16A34A", fontWeight: "bold" }]}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
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
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
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
    elevation: 10,
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

  // --- Auth UI Styles ---
  authScroll: {
    padding: 24,
    justifyContent: "center",
    minHeight: "100%",
  },
  authHeaderBlock: {
    alignItems: "center",
    marginBottom: 35,
    marginTop: 20,
  },
  authLogoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(22, 163, 74, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  authSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  authCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 4px 12px rgba(0,0,0,0.04)",
      },
    }),
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#16A34A",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  activeTabButtonText: {
    fontWeight: "bold",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 15,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  formInputs: {
    gap: 15,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  authSubmitBtn: {
    backgroundColor: "#16A34A",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  authSubmitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // --- Sub-sections UI Styles ---
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sectionBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionScroll: {
    padding: 20,
    paddingBottom: 60,
  },
  cardForm: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  formInputText: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 45,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  formTextArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  formBtn: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontWeight: "bold",
  },
  submitBtn: {
    backgroundColor: "#16A34A",
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  addFarmTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#16A34A",
    borderRadius: 16,
    height: 50,
    marginBottom: 20,
  },
  addFarmTriggerText: {
    color: "#16A34A",
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
  },
  farmsContainer: {
    gap: 12,
  },
  farmCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
  },
  farmDetails: {
    flex: 1,
  },
  farmName: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
  },
  farmMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  farmBadge: {
    backgroundColor: "rgba(22, 163, 74, 0.1)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  farmBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#16A34A",
  },
  farmSize: {
    fontSize: 12,
  },
  deleteFarmBtn: {
    padding: 8,
  },

  // --- Scan History Subview Styles ---
  historyContainer: {
    gap: 12,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
  },
  historyThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  historyThumbPlace: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyCrop: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    opacity: 0.6,
  },
  historyDisease: {
    fontSize: 14,
    fontWeight: "bold",
    marginVertical: 2,
  },
  historyTime: {
    fontSize: 10,
  },
  historyViewBtn: {
    padding: 8,
  },

  // --- Modal styles ---
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 100,
  },
  modalContent: {
    width: "100%",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 15,
  },
  modalMeta: {
    width: "100%",
    gap: 6,
    marginBottom: 20,
  },
  modalCrop: {
    fontSize: 13,
    fontWeight: "bold",
  },
  modalDisease: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalConfidence: {
    fontSize: 13,
  },
  modalDate: {
    fontSize: 12,
  },
  modalCloseBtn: {
    backgroundColor: "#16A34A",
    width: "100%",
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // --- Premium Section Styles ---
  premiumBanner: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 25,
  },
  premiumCrown: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  premiumStatusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  premiumStatusSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  benefitsGrid: {
    gap: 15,
    marginBottom: 30,
  },
  benefitsHeader: {
    fontSize: 15,
    fontWeight: "bold",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  benefitTextGroup: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
  },
  benefitDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  premiumUpgradeBtn: {
    backgroundColor: "#16A34A",
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  premiumUpgradeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  // --- Notification Subview Styles ---
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  toggleTextGroup: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
  },
  toggleDesc: {
    fontSize: 12,
  },
  alertFeed: {
    gap: 12,
  },
  alertCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
  },
  alertCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  alertCardTime: {
    fontSize: 10,
  },
  alertCardBody: {
    fontSize: 12,
    lineHeight: 18,
  },

  // --- Support Subview Styles ---
  supportSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
});