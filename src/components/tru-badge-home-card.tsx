import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export interface TruBadgeHomeCardProps {
  title: string;
  description: string;
  label: string;
  labelColor: string;
  icon?: React.ReactNode | string;
  onPress?: () => void;
}

export const TruBadgeHomeCard: React.FC<TruBadgeHomeCardProps> = ({
  title,
  description,
  label,
  labelColor,
  icon,
  onPress,
}) => {
  const hasLabel = Boolean(label);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        hasLabel && styles.cardWithLabel,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Tag/Label - top right (optional) */}
      {label ? (
        <View style={[styles.label, { backgroundColor: labelColor }]}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      ) : null}

      {/* Icon Container with badge background */}
      <View style={styles.iconWrapper}>
        <View style={styles.iconBackgroundWrapper}>
          <Image
            source={Images.badgeUnlock}
            style={styles.iconBackground}
            resizeMode="contain"
          />
        </View>
        <View style={styles.iconForegroundWrapper}>
          {icon != null &&
            (React.isValidElement(icon) ? (
              <View style={styles.iconSizeWrap}>{icon}</View>
            ) : typeof icon === "string" ? (
              <Text style={styles.iconEmoji}>{icon}</Text>
            ) : (
              // @ts-ignore - Image source (require() or { uri })
              <Image source={icon} style={styles.icon} resizeMode="contain" />
            ))}
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>{description}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "stretch",
    width: "100%",
    flex: 1,
    minHeight: 200,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 12,
    justifyContent: "flex-start",
  },
  cardWithLabel: {
    paddingTop: 36,
  },
  cardPressed: {
    opacity: 0.8,
  },
  label: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  labelText: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: "#FFFFFF",
  },
  iconWrapper: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 12,
  },
  iconBackgroundWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackground: {
    width: 70,
    height: 70,
  },
  iconForegroundWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  icon: {
    width: 30,
    height: 30,
  },
  iconSizeWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 24,
    textAlign: "center",
    lineHeight: 26,
    width: 30,
    height: 30,
  },
  title: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersMedium,
    color: Colors.naturalBlack,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: "#4F4F4F",
    textAlign: "center",
  },
});
