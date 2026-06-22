import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { Platform, StyleSheet } from 'react-native';

/**
 * Global styles used across multiple screens
 * Import and use: import { globalStyles } from '@/styles/global';
 */
export const globalStyles = StyleSheet.create({
  // Profile Step Screen Styles
  profileStepTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: FontFamilies.butlerBold,
  },
  profileStepSubtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FontFamilies.ownersRegular,
  },
  deshboardTitle: {
    fontSize: 26,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
  },
  headerRediusView:{
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 10,
    marginTop: Platform.OS === "ios" ? -56 : -42,
    paddingTop: Platform.OS === "ios" ? 56 : 42,

  }
});
