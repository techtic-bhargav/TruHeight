import { redeemBadge } from "@/api/endpoints/users";
import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TruHeightButton } from "./tru-height-button";
import { TruHeightShareButton } from "./tru-height-share-button";

interface TruBadgeEarnedModalProps {
  visible: boolean;
  onClose: () => void;
  onClaim: () => void;
  badgeTitle: string;
  badgeDescription: string;
  badgeCode: string;
  badgeType: "monthly" | "lifetime";
  badgeMonthYear?: string | null;
  badgeAudience?: string;
  badgeChildId?: string | null;
  userRole?: string;
  badgeIcon?: any;
  onShareSocial?: () => void;
  isRedeemed?: boolean;
  socialMediaNote?: string | null;
  // Allow future optional props without breaking JSX usage
  [key: string]: any;
}

export const TruBadgeEarnedModal: React.FC<TruBadgeEarnedModalProps> = ({
  visible,
  onClose,
  onClaim,
  badgeTitle,
  badgeDescription,
  badgeCode,
  badgeType,
  badgeMonthYear,
  badgeAudience,
  badgeChildId,
  userRole,
  badgeIcon,
  onShareSocial,
  isRedeemed,
  socialMediaNote,
}) => {
  const [claimed, setClaimed] = useState(false);
  const badgeScaleAnim = useRef(new Animated.Value(0)).current;
  const [claiming, setClaiming] = useState(false);

  const handleClaimPress = async () => {
    if (claiming || !badgeCode) return;
    try {
      setClaiming(true);
      const baseParams =
        badgeType === "monthly" && badgeMonthYear
          ? { month_year: badgeMonthYear }
          : {};

      // child_id logic:
      // - If audience === "parent": never send child_id
      // - If audience === "child_teen" and userRole === "parent": must send child_id
      // - For non-parent roles, do not send child_id
      let params: { month_year?: string; child_id?: string } | undefined =
        undefined;

      const normalizedAudience = (badgeAudience ?? "").toLowerCase();
      const normalizedRole = (userRole ?? "").toLowerCase();

      if (normalizedAudience === "parent") {
        // Parent audience badges are tied to the logged-in user only
        params = Object.keys(baseParams).length ? baseParams : undefined;
      } else if (
        normalizedAudience === "child_teen" &&
        normalizedRole === "parent"
      ) {
        // For child/teen audience badges viewed by a parent, child_id is required
        if (badgeChildId) {
          params = {
            ...baseParams,
            child_id: badgeChildId,
          };
        } else {
          // If for some reason child_id is missing, fall back to no params
          // (backend should handle validation)
          params = Object.keys(baseParams).length ? baseParams : undefined;
        }
      } else {
        // Child/teen user (or any non-parent) – backend infers user, so no child_id
        params = Object.keys(baseParams).length ? baseParams : undefined;
      }

      await redeemBadge(badgeCode, params);
      setClaimed(true);
      onClaim();
    } catch {
      // Silently ignore for now; could hook into a toast later
    } finally {
      setClaiming(false);
    }
  };

  const openShareSheet = async () => {
    try {
      const message =
        socialMediaNote?.trim() ||
        `Congratulations!! New Badge Earned "${badgeTitle}" on TruHeight! ${badgeDescription}`;
      await Share.share({
        message,
        title: "Badge earned",
      });
      if (onShareSocial) onShareSocial();
    } catch {
      if (onShareSocial) onShareSocial();
    }
  };
  const badgeRotateAnim = useRef(new Animated.Value(0)).current;
  const badgeBounceAnim = useRef(new Animated.Value(0)).current;

  // Ribbon pieces animations
  const ribbonPieces = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    if (visible) {
      setClaimed(!!isRedeemed);
    } else {
      setClaimed(false);
    }
  }, [visible, isRedeemed]);

  useEffect(() => {
    if (!visible) return;

    // Reset animations
    badgeScaleAnim.setValue(0);
    badgeRotateAnim.setValue(0);
    badgeBounceAnim.setValue(0);

    // Reset ribbon pieces
    ribbonPieces.forEach((piece) => {
      piece.translateY.setValue(0);
      piece.translateX.setValue(0);
      piece.rotate.setValue(0);
      piece.opacity.setValue(0);
    });

    // Badge animation sequence (scale + rotate + bounce)
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(badgeScaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(badgeRotateAnim, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(badgeRotateAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Bounce animation after initial animation
      Animated.sequence([
        Animated.timing(badgeBounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(badgeBounceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(badgeBounceAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(badgeBounceAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Ribbon pieces animation (confetti effect)
    ribbonPieces.forEach((piece, index) => {
      const angle = (index * 360) / ribbonPieces.length;
      const distance = 80 + Math.random() * 40;
      const xOffset = Math.cos((angle * Math.PI) / 180) * distance;
      const yOffset = Math.sin((angle * Math.PI) / 180) * distance;
      const rotation = Math.random() * 720 - 360; // Random rotation between -360 and 360

      Animated.sequence([
        Animated.delay(400 + index * 30),
        Animated.parallel([
          Animated.timing(piece.translateY, {
            toValue: yOffset,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(piece.translateX, {
            toValue: xOffset,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotate, {
            toValue: rotation,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(piece.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.delay(800),
            Animated.timing(piece.opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });
  }, [visible, badgeScaleAnim, badgeRotateAnim, badgeBounceAnim, ribbonPieces]);

  const badgeRotation = badgeRotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "15deg", "0deg"],
  });

  const badgeBounce = badgeBounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>

          {/* Title */}
          <Text style={styles.title}>Congratulations!!</Text>
          <Text style={styles.subtitle}>New Badge Earned</Text>

          {/* Badge Visual */}
          <View style={styles.badgeContainer}>
            {/* Ribbon Pieces (Confetti) */}
            {ribbonPieces.map((piece, index) => {
              const colors = [
                "#FF6B6B",
                "#4ECDC4",
                "#FFE66D",
                "#95E1D3",
                "#F38181",
                "#AA96DA",
              ];
              const color = colors[index % colors.length];
              const size = 8 + Math.random() * 4;

              const rotation = piece.rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ["0deg", "360deg"],
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.ribbonPiece,
                    {
                      width: size,
                      height: size * 2,
                      backgroundColor: color,
                      transform: [
                        { translateX: piece.translateX },
                        { translateY: piece.translateY },
                        { rotate: rotation },
                      ],
                      opacity: piece.opacity,
                    },
                  ]}
                />
              );
            })}

            <Animated.View
              style={[
                styles.badgeIconWrapper,
                {
                  transform: [
                    { scale: badgeScaleAnim },
                    { rotate: badgeRotation },
                    { translateY: badgeBounce },
                  ],
                },
              ]}
            >
              {/* Background: badgeUnlock image behind the icon */}
              <View style={styles.badgeIconBackground}>
                <Image
                  source={Images.badgeUnlock}
                  style={styles.badgeUnlockImage}
                  resizeMode="contain"
                />
              </View>
              {/* Foreground: badge emoji/icon */}
              <View style={styles.badgeIconForeground}>
                {badgeIcon ? (
                  React.isValidElement(badgeIcon) ? (
                    badgeIcon
                  ) : typeof badgeIcon === "string" ? (
                    <Text style={styles.badgeEmojiText}>{badgeIcon}</Text>
                  ) : (
                    <Image
                      source={badgeIcon}
                      style={styles.badgeIcon}
                      resizeMode="contain"
                    />
                  )
                ) : (
                  <View style={styles.badgePlaceholder}>
                    <Text style={styles.badgePlaceholderText}>🏆</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          <View style={styles.divider} />

          {/* Badge Name */}
          <Text style={styles.badgeName}>{badgeTitle}</Text>

          {/* Badge Description */}
          <Text style={styles.badgeDescription}>{badgeDescription}</Text>

          {/* Claim / Share on Social button */}
          <View style={styles.claimButtonWrapper}>
            {!claimed ? (
              <TruHeightButton title="Claim" onPress={handleClaimPress} />
            ) : (
              <TruHeightShareButton
                title="Share on Social"
                onPress={openShareSheet}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.naturalBlack,
    fontFamily: FontFamilies.ownersBold,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
    textAlign: "center",
    marginBottom: 24,
  },
  badgeContainer: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    width: 140,
    height: 140,
    position: "relative",
  },
  ribbonPiece: {
    position: "absolute",
    borderRadius: 2,
  },
  badgeIconWrapper: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  badgeIconBackground: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeUnlockImage: {
    width: 110,
    height: 110,
  },
  badgeIconForeground: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  badgeEmojiText: {
    fontSize: 60,
    textAlign: "center",
    lineHeight: 40,
  },
  badgeIcon: {
    width: 20,
    height: 20,
  },
  badgePlaceholder: {
    width: 20,
    height: 20,
    backgroundColor: Colors.onboardingBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePlaceholderText: {
    fontSize: 60,
  },
  divider: {
    width: 75,
    height: 1,
    backgroundColor: Colors.brandText,
    marginBottom: 16,
  },
  badgeName: {
    fontSize: 20,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
    textAlign: "center",
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  claimButtonWrapper: {
    width: "100%",
  },
});
