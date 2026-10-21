// components/MarushLogo.tsx
import React from "react";
import { Image, Text, View } from "react-native";
import { Colors } from "../constants/design";

interface MarushLogoProps {
  size?: "sm" | "nav" | "md" | "lg";
  variant?: "full" | "mark";
  framed?: boolean;
  showSubtitle?: boolean;
  theme?: "light" | "dark";
}

const logoSource = require("../../assets/logo-transparent.png");
const logoAspectRatio = 230 / 219;

export const MarushLogo: React.FC<MarushLogoProps> = ({
  size = "md",
  variant = "full",
  framed = true,
  showSubtitle = true,
  theme = "light",
}) => {
  const dimensions = {
    sm: { imageHeight: 30, frame: 40, subSize: 10, corner: 10 },
    nav: { imageHeight: 42, frame: 48, subSize: 10, corner: 12 },
    md: { imageHeight: 64, frame: 80, subSize: 12, corner: 12 },
    lg: { imageHeight: 112, frame: 128, subSize: 14, corner: 16 },
  }[size];

  const isDark = theme === "dark";

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
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {framed ? (
        <View
          style={{
            width: dimensions.frame,
            height: dimensions.frame,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: dimensions.corner,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
          }}
        >
          {logoImage}
        </View>
      ) : (
        logoImage
      )}

      {variant !== "mark" && showSubtitle && (
        <Text
          style={{
            marginTop: 8,
            maxWidth: 260,
            textAlign: "center",
            fontSize: dimensions.subSize,
            fontWeight: "500",
            color: isDark ? Colors.textSecondary : Colors.textTertiary,
          }}
        >
          Exclusive Sole Distributor of Ceva Animal Health in Pakistan
        </Text>
      )}
    </View>
  );
};
