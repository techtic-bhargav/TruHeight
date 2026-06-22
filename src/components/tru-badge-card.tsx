import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export type BadgeStatus = "unlocked" | "in-progress" | "locked";

interface TruBadgeCardProps {
  title: string;
  description: string;
  status: BadgeStatus;
  icon?: React.ReactNode;
  label?: string;
  onPress?: () => void;
}

export const TruBadgeCard: React.FC<TruBadgeCardProps> = ({
  title,
  description,
  status,
  icon,
  label,
  onPress,
}) => {
  const isUnlocked = status === "unlocked";
  const isLocked = status === "locked";
  const hasLabel = Boolean(label);

  return (
    <Pressable
      onPress={isUnlocked ? onPress : undefined}
      disabled={!isUnlocked}
      style={({ pressed }) => [
        styles.card,
        hasLabel && styles.cardWithLabel,
        {
          backgroundColor: isLocked
            ? Colors.textFieldBackground
            : Colors.background,
        },
        pressed && isUnlocked && styles.cardPressed,
      ]}
    >
      {/* Optional audience label (e.g., Parent) */}
      {label ? (
        <View style={styles.label}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      ) : null}
      {/* Icon Container */}
      <View style={styles.iconContainer}>
        <View style={styles.iconBackgroundWrapper}>
          <Image
            source={isUnlocked ? Images.badgeUnlock : Images.badgeLock}
            style={styles.iconBackground}
            resizeMode="contain"
          />
        </View>
        <View style={styles.iconForegroundWrapper}>
          {isUnlocked ? (
            icon != null &&
            (React.isValidElement(icon) ? (
              <View style={styles.iconSizeWrap}>{icon}</View>
            ) : typeof icon === "string" ? (
              <Text style={styles.iconEmoji}>{icon}</Text>
            ) : (
              // @ts-ignore - Image source (require() or { uri })
              <Image source={icon} style={styles.icon} resizeMode="contain" />
            ))
          ) : (
            <Image
              source={Images.lock}
              style={styles.icon}
              resizeMode="contain"
            />
          )}
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Description — full text, wraps; row height matches sibling via flex stretch */}
      <Text style={[styles.description, isLocked && styles.descriptionLocked]}>
        {description}
      </Text>
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
  label: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: Colors.badgeLabelParent,
  },
  labelText: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: "#FFFFFF",
  },
  cardPressed: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 6,
    width: "100%",
  },
  description: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.lightGray,
    textAlign: "center",
    width: "100%",
    flexShrink: 1,
  },
  descriptionLocked: {
    color: Colors.textFieldPlaceholder,
  },
});
