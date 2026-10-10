import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { MarushLogo } from '../components/MarushLogo';

interface LaunchScreenProps {
  onFinishLaunch: () => void;
}

export const LaunchScreen: React.FC<LaunchScreenProps> = ({ onFinishLaunch }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinishLaunch();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinishLaunch]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <MarushLogo size="lg" variant="full" showSubtitle={true} />

        <View style={styles.distributorBadge}>
          <Text style={styles.distributorBadgeText}>
            EXCLUSIVE SOLE DISTRIBUTOR OF CEVA ANIMAL HEALTH
          </Text>
        </View>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading Vaccination Programs & Data...</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Poultry Vaccines • Hatchery Services • Farm Flock Monitoring
        </Text>
        <Text style={styles.versionText}>v1.0.0 (Expo + Supabase RBAC)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 440,
  },
  distributorBadge: {
    marginTop: 20,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  distributorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  loaderContainer: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
