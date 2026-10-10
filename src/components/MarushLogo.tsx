import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import Svg, { Path } from 'react-native-svg';

interface MarushLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'mark';
  showSubtitle?: boolean;
}

export const MarushLogo: React.FC<MarushLogoProps> = ({
  size = 'md',
  variant = 'full',
  showSubtitle = true,
}) => {
  const dimensions = {
    sm: { markSize: 44, titleSize: 18, subSize: 10 },
    md: { markSize: 64, titleSize: 24, subSize: 12 },
    lg: { markSize: 96, titleSize: 34, subSize: 14 },
  }[size];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            width: dimensions.markSize,
            height: dimensions.markSize,
            borderRadius: dimensions.markSize / 4,
          },
        ]}
      >
        <Svg
          width={dimensions.markSize * 0.75}
          height={dimensions.markSize * 0.75}
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Stylized Marush Bird & Wing Path with Brand Forest Green and Vibrant Cyan */}
          <Path
            d="M 15 50 C 15 25, 45 15, 80 20 C 65 35, 50 45, 50 65 C 50 80, 40 85, 25 80 C 15 75, 15 60, 15 50 Z"
            fill={Colors.secondary}
          />
          <Path
            d="M 25 45 C 35 25, 65 18, 88 28 C 72 40, 58 55, 52 75 C 42 78, 30 75, 25 60 Z"
            fill={Colors.primary}
            opacity={0.9}
          />
          <Path
            d="M 40 35 C 55 22, 78 26, 92 38 C 76 48, 65 62, 60 82 C 52 78, 45 68, 40 55 Z"
            fill={Colors.accent}
          />
        </Svg>
      </View>

      {variant !== 'mark' && (
        <View style={styles.textContainer}>
          <View style={styles.brandTitleRow}>
            <Text style={[styles.brandTitle, { fontSize: dimensions.titleSize }]}>
              MARUSH
            </Text>
            <Text style={styles.pvtLtd}> (Pvt.) Ltd.</Text>
          </View>
          {showSubtitle && (
            <Text style={[styles.subtitle, { fontSize: dimensions.subSize }]}>
              Exclusive Sole Distributor of Ceva Animal Health in Pakistan
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitle: {
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 2,
  },
  pvtLtd: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryDark,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});
