import React, { useEffect, useRef } from "react";
import { Animated, Text, View, useWindowDimensions } from "react-native";
import { MarushLogo } from "../components/MarushLogo";
import { Colors } from "../constants/colors";

interface LaunchScreenProps {
  onFinishLaunch: () => void;
}

const PARTICLES = [
  { size: 7, x: -74, y: -58, delay: 0 },
  { size: 5, x: 72, y: -66, delay: 90 },
  { size: 8, x: 82, y: 25, delay: 160 },
  { size: 4, x: -86, y: 34, delay: 230 },
  { size: 5, x: 42, y: 72, delay: 300 },
  { size: 6, x: -40, y: 76, delay: 370 },
];

export const LaunchScreen: React.FC<LaunchScreenProps> = ({
  onFinishLaunch,
}) => {
  const { width, height } = useWindowDimensions();
  const sweepX = useRef(new Animated.Value(-width * 1.4)).current;
  const sweepY = useRef(new Animated.Value(height * 1.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const particleProgress = useRef(
    PARTICLES.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const particleAnimations = particleProgress.map((progress, index) =>
      Animated.sequence([
        Animated.delay(PARTICLES[index].delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 620,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.sequence([
      Animated.parallel([
        Animated.timing(sweepX, {
          toValue: width * 1.6,
          duration: 1350,
          useNativeDriver: true,
        }),
        Animated.timing(sweepY, {
          toValue: -height * 1.6,
          duration: 1350,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 55,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        ...particleAnimations,
        Animated.sequence([
          Animated.delay(760),
          Animated.timing(exitOpacity, {
            toValue: 0,
            duration: 360,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => onFinishLaunch());

    return () => {
      sweepX.stopAnimation();
      sweepY.stopAnimation();
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      exitOpacity.stopAnimation();
      particleProgress.forEach((progress) => progress.stopAnimation());
    };
  }, [
    exitOpacity,
    height,
    logoOpacity,
    logoScale,
    onFinishLaunch,
    particleProgress,
    sweepX,
    sweepY,
    width,
  ]);

  return (
    <Animated.View
      className="flex-1 items-center justify-center overflow-hidden bg-[#e9f7f5]"
      style={{ opacity: exitOpacity }}
    >
      <Animated.View
        className="absolute h-[260%] w-[220%] bg-marush-primary"
        style={{
          transform: [
            { translateX: sweepX },
            { translateY: sweepY },
            { rotate: "-45deg" },
          ],
        }}
      />
      <View className="absolute h-64 w-64 rounded-full bg-marush-secondary/10" />

      <Animated.View
        className="items-center justify-center"
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <MarushLogo size="lg" variant="mark" />
        <Text className="mt-5 text-xl font-extrabold tracking-[3px] text-marush-primary">
          MARUSH
        </Text>
        <Text className="mt-1 text-[10px] font-bold uppercase tracking-[1.8px] text-marush-secondary-dark">
          Field operations
        </Text>
      </Animated.View>

      {PARTICLES.map((particle, index) => {
        const progress = particleProgress[index];
        return (
          <Animated.View
            key={`${particle.x}-${particle.y}`}
            className="absolute rounded-full"
            style={{
              left: width / 2 - particle.size / 2,
              top: height / 2 - particle.size / 2,
              width: particle.size,
              height: particle.size,
              backgroundColor:
                index % 2 === 0 ? Colors.secondary : Colors.primaryLight,
              opacity: progress.interpolate({
                inputRange: [0, 0.2, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, particle.x],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, particle.y],
                  }),
                },
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.25, 1],
                    outputRange: [0.3, 1, 0.6],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </Animated.View>
  );
};
