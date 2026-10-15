import React from 'react';
import { View, Text, Image } from 'react-native';

interface MarushLogoProps {
  size?: 'sm' | 'nav' | 'md' | 'lg';
  variant?: 'full' | 'mark';
  framed?: boolean;
  showSubtitle?: boolean;
}

const logoSource = require('../../assets/logo-transparent.png');
const logoAspectRatio = 230 / 219;

export const MarushLogo: React.FC<MarushLogoProps> = ({
  size = 'md',
  variant = 'full',
  framed = true,
  showSubtitle = true,
}) => {
  const dimensions = {
    sm: { imageHeight: 30, frameClass: 'h-10 w-10', subClass: 'text-[10px]', cornerClass: 'rounded-lg' },
    nav: { imageHeight: 42, frameClass: 'h-12 w-12', subClass: 'text-[10px]', cornerClass: 'rounded-xl' },
    md: { imageHeight: 64, frameClass: 'h-20 w-20', subClass: 'text-xs', cornerClass: 'rounded-xl' },
    lg: { imageHeight: 112, frameClass: 'h-32 w-32', subClass: 'text-sm', cornerClass: 'rounded-2xl' },
  }[size];

  const logoImage = (
    <Image
      source={logoSource}
      style={{
        width: dimensions.imageHeight * logoAspectRatio,
        height: dimensions.imageHeight,
      }}
      resizeMode="contain"
      accessible
      accessibilityLabel="MARUSH company logo"
    />
  );

  return (
    <View className="items-center justify-center">
      {framed ? (
        <View
          className={`${dimensions.frameClass} items-center justify-center border border-marush-border bg-white shadow-md ${dimensions.cornerClass}`}
        >
          {logoImage}
        </View>
      ) : (
        logoImage
      )}

      {variant !== 'mark' && showSubtitle && (
        <Text className={`mt-2 max-w-[260px] text-center font-medium text-marush-muted ${dimensions.subClass}`}>
          Exclusive Sole Distributor of Ceva Animal Health in Pakistan
        </Text>
      )}
    </View>
  );
};
