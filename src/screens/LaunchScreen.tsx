import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { MarushLogo } from "../components/MarushLogo";
import { Colors, Motion, Spacing, Type } from "../constants/design";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/* ECG-style path. Two peaks, mirrored. */
const PATH_D =
  "M0 100 L70 100 L88 58 L106 142 L124 100 L196 100 L210 82 L224 118 L238 100 L400 100";

/* Peak positions along the path (approx x) for burst rings */
const PEAKS = [88, 106, 210, 224];

export const LaunchScreen: React.FC<{ onFinishLaunch: () => void }> = ({
  onFinishLaunch,
}) => {
  const { width, height } = useWindowDimensions();

  // Grid & baseline
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const baselineDraw = useRef(new Animated.Value(0)).current;

  // Main pulse
  const draw = useRef(new Animated.Value(0)).current;
  const headProgress = useRef(new Animated.Value(0)).current;

  // Peak bursts
  const burstProgress = useRef(PEAKS.map(() => new Animated.Value(0))).current;

  // Ambient glow
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.7)).current;

  // Logo
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.94)).current;
  const logoY = useRef(new Animated.Value(10)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Tagline
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Footer rule
  const footerRuleWidth = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // Exit
  const exitScale = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const burstAnims = burstProgress.map((p, i) =>
      Animated.sequence([
        Animated.delay(120 + i * 40),
        Animated.timing(p, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.sequence([
      /* 1 ── Grid paper fades in (blueprint backdrop) */
      Animated.timing(gridOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      /* 2 ── Baseline draws left→right (the "reference" ECG trace) */
      Animated.parallel([
        Animated.timing(baselineDraw, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      /* 3 ── The live pulse draws in, head dot rides along, peaks burst */
      Animated.parallel([
        Animated.timing(draw, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(headProgress, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        ...burstAnims,
      ]),

      /* 4 ── Logo reveal: ring expands, then logo lifts in */
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(ringScale, {
              toValue: 2.4,
              duration: 700,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(120),
          Animated.parallel([
            Animated.timing(logoOpacity, {
              toValue: 1,
              duration: 380,
              useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
              toValue: 1,
              friction: Motion.spring.friction,
              tension: Motion.spring.tension,
              useNativeDriver: true,
            }),
            Animated.timing(logoY, {
              toValue: 0,
              duration: 420,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),

      /* 5 ── Tagline + footer rule */
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(footerRuleWidth, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      /* 6 ── Hold, then zoom-fade out */
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 420,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(exitScale, {
          toValue: 1.04,
          duration: 420,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onFinishLaunch());

    return () => {
      [
        gridOpacity,
        baselineDraw,
        draw,
        headProgress,
        glowOpacity,
        glowScale,
        logoOpacity,
        logoScale,
        logoY,
        ringScale,
        ringOpacity,
        taglineOpacity,
        footerRuleWidth,
        footerOpacity,
        exitScale,
        exitOpacity,
      ].forEach((v) => v.stopAnimation());
      burstProgress.forEach((p) => p.stopAnimation());
    };
  }, []);

  const pathTop = height / 2 - 100;
  const pathWidth = width;
  const headX = headProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pathWidth],
  });
  // The head follows the y of the path — approximate by interpolating peaks
  const headY = headProgress.interpolate({
    inputRange: [0, 0.22, 0.265, 0.31, 0.49, 0.525, 0.56, 1],
    outputRange: [100, 100, 58, 142, 100, 82, 118, 100],
  });

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: Colors.surface,
        opacity: exitOpacity,
        transform: [{ scale: exitScale }],
      }}
    >
      {/* ───────────── Ambient glow (behind everything) ───────────── */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: height / 2 - 260,
          left: width / 2 - 260,
          width: 520,
          height: 520,
          borderRadius: 260,
          backgroundColor: Colors.accent,
          opacity: glowOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.07],
          }),
          transform: [{ scale: glowScale }],
        }}
      />

      {/* ───────────── Grid paper ───────────── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: gridOpacity }]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.white} stopOpacity="0.02" />
              <Stop offset="0.5" stopColor={Colors.white} stopOpacity="0.06" />
              <Stop offset="1" stopColor={Colors.white} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          {Array.from({ length: 14 }).map((_, i) => (
            <Rect
              key={`h${i}`}
              x="0"
              y={(height / 14) * i}
              width={width}
              height="1"
              fill="url(#gridFade)"
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <Rect
              key={`v${i}`}
              x={(width / 8) * i}
              y="0"
              width="1"
              height={height}
              fill="url(#gridFade)"
            />
          ))}
        </Svg>
      </Animated.View>

      {/* ───────────── ECG trace area ───────────── */}
      <View
        style={{
          position: "absolute",
          top: pathTop,
          left: 0,
          width: width,
          height: 200,
        }}
      >
        <Svg width={width} height={200} viewBox={`0 0 ${width} 200`}>
          <Defs>
            <LinearGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={Colors.accent} stopOpacity="0" />
              <Stop offset="0.5" stopColor={Colors.accent} stopOpacity="0.85" />
              <Stop offset="1" stopColor={Colors.accent} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="baselineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={Colors.white} stopOpacity="0" />
              <Stop offset="0.5" stopColor={Colors.white} stopOpacity="0.12" />
              <Stop offset="1" stopColor={Colors.white} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Baseline (static reference trace) */}
          <AnimatedPath
            d={PATH_D}
            stroke="url(#baselineGrad)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="1000"
            strokeDashoffset={baselineDraw.interpolate({
              inputRange: [0, 1],
              outputRange: [1000, 0],
            })}
            transform={`scale(${width / 400} 1)`}
          />

          {/* Live pulse trace */}
          <AnimatedPath
            d={PATH_D}
            stroke="url(#pulseGrad)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="1000"
            strokeDashoffset={draw.interpolate({
              inputRange: [0, 1],
              outputRange: [1000, 0],
            })}
            transform={`scale(${width / 400} 1)`}
          />

          {/* Peak bursts (expanding rings at each spike) */}
          {PEAKS.map((px, i) => {
            const scaledX = (px / 400) * width;
            return (
              <AnimatedCircle
                key={i}
                cx={scaledX}
                cy={i < 2 ? 58 : 82}
                r={burstProgress[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 14],
                })}
                stroke={Colors.accent}
                strokeWidth="1.2"
                fill="none"
                opacity={burstProgress[i].interpolate({
                  inputRange: [0, 0.2, 1],
                  outputRange: [0, 0.9, 0],
                })}
              />
            );
          })}

          {/* Glowing head that rides the pulse */}
          <G>
            <AnimatedCircle
              cx={headX}
              cy={headY}
              r="10"
              fill={Colors.accent}
              opacity={headProgress.interpolate({
                inputRange: [0, 0.02, 0.95, 1],
                outputRange: [0, 0.25, 0.25, 0],
              })}
            />
            <AnimatedCircle
              cx={headX}
              cy={headY}
              r="4"
              fill={Colors.white}
              opacity={headProgress.interpolate({
                inputRange: [0, 0.02, 0.95, 1],
                outputRange: [0, 1, 1, 0],
              })}
            />
          </G>
        </Svg>
      </View>

      {/* ───────────── Logo + ring + wordmark ───────────── */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: 70,
            borderWidth: 1.5,
            borderColor: Colors.accent,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          }}
        />

        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoY }],
          }}
        >
          <MarushLogo size="lg" variant="mark" theme="dark" framed={false} />
        </Animated.View>

        <Animated.Text
          style={{
            opacity: taglineOpacity,
            marginTop: Spacing["2xl"] - 2,
            ...Type.eyebrow,
            fontSize: 10,
            letterSpacing: 3.2,
            color: Colors.accent,
          }}
        >
          Cold Chain Integrity
        </Animated.Text>
      </View>

      {/* ───────────── Footer ───────────── */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: Spacing["5xl"] - 12,
          left: 0,
          right: 0,
          alignItems: "center",
          opacity: footerOpacity,
        }}
      >
        {/* Draw-in rule */}
        <Animated.View
          style={{
            height: 1,
            width: footerRuleWidth.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 120],
            }),
            backgroundColor: Colors.accent,
            opacity: 0.5,
            marginBottom: Spacing.md,
          }}
        />
        <Text
          style={{
            fontSize: 9,
            fontWeight: "600",
            letterSpacing: 1.6,
            color: Colors.textSecondary,
            textTransform: "uppercase",
          }}
        >
          CEVA's Exclusive Distributor in Pakistan
        </Text>
      </Animated.View>
    </Animated.View>
  );
};
