import { FontFamilies } from '@/constants/fonts';
import { Images } from '@/constants/images';
import { Colors } from '@/constants/theme';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const AVATAR_SIZE = 80;
const RING_SIZE = 96; // 👈 ring bigger than avatar
const AVATAR_GAP = 14;
const ITEM_WIDTH = AVATAR_SIZE + AVATAR_GAP;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CENTER_OFFSET = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

const AVATAR_IMAGES = [
    Images.avatar1,
    Images.avatar2,
    Images.avatar3,
    Images.avatar4,
    Images.avatar5,
];

interface TruAvatarPickerProps {
    selectedIndex?: number;
    onSelect: (index: number) => void;
    avatars?: Array<any>; // API avatars + uploaded images
}

export function TruAvatarPicker({
    selectedIndex: propSelectedIndex = 2,
    onSelect,
    avatars = [],
}: TruAvatarPickerProps) {
    const scrollRef = useRef<ScrollView>(null);
    const [selectedIndex, setSelectedIndex] = useState(propSelectedIndex);

    // Process avatars: convert API avatars and custom images to image sources
    const avatarList = React.useMemo(() => {
        if (avatars.length > 0) {
            return avatars.map((avatar: any) => {
                // Get image URL from various possible fields
                const imageUrl = avatar.url || avatar.image || avatar.image_url;
                if (imageUrl) {
                    return { uri: imageUrl };
                }
                // Fallback to default avatar if no URL
                return AVATAR_IMAGES[0];
            });
        }
        // Fallback to default avatars if no API avatars
        return AVATAR_IMAGES;
    }, [avatars]);

    useEffect(() => {
        requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({
                x: propSelectedIndex * ITEM_WIDTH,
                animated: false,
            });
        });
    }, [propSelectedIndex, avatarList.length]);

    useEffect(() => {
        // Reset selected index when avatars change
        if (avatarList.length > 0 && propSelectedIndex >= avatarList.length) {
            const safeIndex = Math.min(propSelectedIndex, avatarList.length - 1);
            setSelectedIndex(safeIndex);
            onSelect(safeIndex);
        }
    }, [avatarList.length, propSelectedIndex, onSelect]);

    const maxScrollOffset = avatarList.length > 0 ? (avatarList.length - 1) * ITEM_WIDTH : 0;

    const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = e.nativeEvent.contentOffset.x;
        const index = Math.round(offset / ITEM_WIDTH);
        const safeIndex = Math.max(0, Math.min(avatarList.length - 1, index));
        setSelectedIndex(safeIndex);
        onSelect(safeIndex);
        if (avatarList.length > 0 && safeIndex === avatarList.length - 1 && Math.abs(offset - maxScrollOffset) > 2) {
            scrollRef.current?.scrollTo({ x: maxScrollOffset, animated: true });
        }
    };

    const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = e.nativeEvent.contentOffset.x;
        const index = Math.round(offset / ITEM_WIDTH);
        const safeIndex = Math.max(0, Math.min(avatarList.length - 1, index));
        setSelectedIndex(safeIndex);
        onSelect(safeIndex);
        if (avatarList.length > 0 && safeIndex === avatarList.length - 1 && Math.abs(offset - maxScrollOffset) > 2) {
            scrollRef.current?.scrollTo({ x: maxScrollOffset, animated: true });
        }
    };

    const contentWidth = avatarList.length > 0 ? CENTER_OFFSET * 2 + avatarList.length * ITEM_WIDTH : undefined;

    return (
        <View style={styles.wrapper}>
            <View style={styles.pickerContainer}>
                {/* CENTER RING */}
                <View style={styles.selectionRing} pointerEvents="none" />

                <ScrollView
                    ref={scrollRef}
                    horizontal
                    snapToInterval={ITEM_WIDTH}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleEnd}
                    onScrollEndDrag={handleScrollEndDrag}
                    bounces={false}
                    overScrollMode="never"
                    contentContainerStyle={[styles.scrollContent, contentWidth != null && { width: contentWidth }]}
                >
                    {avatarList.map((avatar, index) => {
                        const distance = Math.abs(index - selectedIndex);
                        const scale = Math.max(0.85, 1 - distance * 0.08);
                        const opacity = Math.max(0.6, 1 - distance * 0.12);
                        const avatarData = avatars[index];
                        const avatarId = avatarData?.id || `avatar-${index}`;

                        return (
                            <View key={avatarId} style={styles.avatarItem}>
                                {/* FIXED MASK */}
                                <View style={[styles.avatarMask]}>
                                    <Image
                                        source={avatar}
                                        contentFit={avatarData?.type === 'custom' ? 'cover' : 'contain'}
                                        contentPosition="center"
                                        style={[
                                            styles.avatarImage,
                                            {
                                                transform: [{ scale }],
                                                opacity,
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            <Text style={styles.orText}>OR</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        alignItems: 'center',
        marginVertical: 10,
    },

    pickerContainer: {
        width: '100%',
        height: RING_SIZE,
        justifyContent: 'center',
    },

    selectionRing: {
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -RING_SIZE / 2 }],
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: RING_SIZE / 2,
        borderWidth: 2,
        borderColor: Colors.naturalBlack,
        zIndex: 5,
    },

    scrollContent: {
        paddingHorizontal: CENTER_OFFSET,
        alignItems: 'center',
    },

    avatarItem: {
        width: ITEM_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* INNER MASK — THIS FIXES EVERYTHING */
    avatarMask: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginStart: -48,
        // marginEnd: -95,
    },

    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: AVATAR_SIZE / 2,
    },

    orText: {
        marginTop: 8,
        fontSize: 12,
        letterSpacing: 0.4,
        fontFamily: FontFamilies.ownersRegular,
        color: '#474342',
    },
});


