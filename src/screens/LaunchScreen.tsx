import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Colors } from '../constants/colors';
import { MarushLogo } from '../components/MarushLogo';

interface LaunchScreenProps {
  onFinishLaunch: () => void;
}

export const LaunchScreen: React.FC<LaunchScreenProps> = ({ onFinishLaunch }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinishLaunch();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinishLaunch]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MarushLogo size="lg" variant="full" showSubtitle={true} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Colors.secondary} />
          <Text style={styles.loadingText}>Initializing Services & Cold-Chain Data...</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Poultry Vaccines • Hatchery Vaccination • Flock Monitoring
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 420,
  },
  loaderContainer: {
    marginTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
