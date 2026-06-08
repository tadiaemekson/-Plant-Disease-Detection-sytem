import { useRouter } from 'expo-router';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === 'dark' ? 'dark' : 'light') as keyof typeof Colors;
  const theme = Colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.content}>
        
        {/* Top Branding Section */}
        <View style={styles.topSection}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../../assets/images/plant-disease-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Bottom Card Content Section */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="title" style={[styles.title, { color: theme.text }]}>
            AgroScan 🌿
          </ThemedText>
          
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Diagnose plant diseases instantly using advanced AI. Scan leaf anomalies, find causes, and get professional treatment guidelines to secure your crop yield.
          </ThemedText>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#16A34A' }]} // Forest Green
            onPress={() => router.push('/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
          
          <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            By continuing, you agree to secure agricultural analytics.
          </Text>
        </View>
        
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 170,
    height: 170,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  card: {
    padding: Spacing.four,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.one,
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: Spacing.two,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: Spacing.one,
  },
});
