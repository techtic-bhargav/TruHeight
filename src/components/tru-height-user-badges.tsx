import { FontFamilies } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import React from "react";
import type { ImageSourcePropType } from "react-native";
import { StyleSheet, Text, View } from "react-native";

export interface TruHeightUserBadgesProps {
  image: ImageSourcePropType;
  title: string;
  bottomTitle: string;
}

export const TruHeightUserBadges: React.FC<TruHeightUserBadgesProps> = ({
  image,
  title,
  bottomTitle,
}) => {
  const pillMinWidth = title.toLowerCase().includes("subscriber") ? 160 : 143;

  return (
    <View style={[styles.pill, { minWidth: pillMinWidth }]}>
      <Image source={image} style={styles.icon} contentFit="contain" />

      <View style={styles.textGroup}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.bottomTitle} numberOfLines={1}>
          {bottomTitle}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.naturalBlack,
    borderRadius: 20,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    justifyContent: "flex-start",
  },
  icon: {
    width: 15,
    height: 15,
    marginRight: 8,
  },
  textGroup: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontFamily: FontFamilies.butlerBold,
    fontSize: 11,
    lineHeight: 14,
    includeFontPadding: false,
  },
  bottomTitle: {
    color: "#E0B997",
    fontFamily: FontFamilies.ownersRegular,
    fontSize: 9,
    lineHeight: 11,
    includeFontPadding: false,
  },
});
