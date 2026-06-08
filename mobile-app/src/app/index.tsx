import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Animated, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SplashScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === 'dark' ? 'dark' : 'light') as keyof typeof Colors;
  const theme = Colors[scheme];
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Parallel spring scale and fade entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fade in the subtitle text after logo springs in
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    });

    // Navigate to welcome screen after 3.2 seconds
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: '#115E59' }]}> {/* Deep Teal/Green */}
      <SafeAreaView style={styles.content}>
        
        <Animated.View style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}>
          <Image 
            source={require('../../assets/images/plant-disease-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
          <Text style={styles.appName}>AgroScan</Text>
          <Text style={styles.appSubtitle}>AI Leaf Diagnosis & Cure</Text>
          <ActivityIndicator color="#10B981" size="small" style={styles.spinner} />
        </Animated.View>

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#D1FAE5', // Light emerald green
    marginTop: 6,
    fontWeight: '500',
    opacity: 0.9,
  },
  spinner: {
    marginTop: 40,
  },
});
