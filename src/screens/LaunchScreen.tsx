import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { MarushLogo } from '../components/MarushLogo';

interface LaunchScreenProps {
  onFinishLaunch: () => void;
}

export const LaunchScreen: React.FC<LaunchScreenProps> = ({ onFinishLaunch }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 35,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        onFinishLaunch();
      });
    }, 1900);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinishLaunch]);

  return (
    <View className="flex-1 items-center justify-center bg-marush-background px-6">
      {/* Decorative ambient background accents */}
      <View className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-marush-primary-subtle/50 blur-3xl" />
      <View className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-marush-secondary-light/10 blur-3xl" />

      <Animated.View
        className="w-full max-w-[480px] items-center justify-center rounded-3xl border border-marush-border/80 bg-white/90 p-10 shadow-xl backdrop-blur-md"
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
      >
        <MarushLogo size="lg" variant="full" showSubtitle={true} />

        <View className="mt-8 flex-row items-center gap-3 rounded-full border border-marush-border bg-marush-subtle/70 px-4 py-2">
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text className="text-[12px] font-semibold tracking-wide text-marush-primary">
            Initializing Field Operations…
          </Text>
        </View>

        <Text className="mt-5 text-center text-[11px] font-medium tracking-wider uppercase text-marush-muted">
          Marush • Ceva Animal Health Partner
        </Text>
      </Animated.View>
    </View>
  );
};
