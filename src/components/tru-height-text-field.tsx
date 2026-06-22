import { FontFamilies } from '@/constants/fonts';
import { Images } from '@/constants/images';
import { Colors } from '@/constants/theme';
import { Image } from 'expo-image';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

export type TruHeightTextFieldProps = {
  label: string;
  secureToggle?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
} & Omit<TextInputProps, 'style' | 'value' | 'onChangeText'>;

export const TruHeightTextField = React.forwardRef<TextInput, TruHeightTextFieldProps>(function TruHeightTextField(
  {
    label,
    secureToggle = false,
    value,
    onChangeText,
    error,
    ...inputProps
  },
  ref
) {
  const [secure, setSecure] = React.useState(!!inputProps.secureTextEntry);

  const commonInputProps: TextInputProps = {
    placeholderTextColor: stylesVars.placeholder,
    ...inputProps,
  };

  const isDisabled = inputProps.editable === false;
  const borderColor = error ? '#DC3545' : stylesVars.inputBorder;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: Colors.titleBlack }]}>{label}</Text>
      {secureToggle ? (
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: stylesVars.inputBg,
              borderColor,
            },
          ]}
        >
          <TextInput
            ref={ref}
            {...commonInputProps}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secure}
            style={[styles.inputInner, { color: Colors.naturalBlack }]}
          />
          <Pressable
            accessibilityLabel={secure ? 'Show password' : 'Hide password'}
            onPress={() => setSecure((v) => !v)}
            hitSlop={10}
            style={styles.eyeButton}
          >
            <Image
              source={secure ? Images.eyeOff : Images.eyeOn}
              style={styles.eyeIcon}
              contentFit="contain"
            />
          </Pressable>
        </View>
      ) : (
        <TextInput
          ref={ref}
          {...commonInputProps}
          value={value}
          onChangeText={onChangeText}
          style={[
            styles.input,
            {
              backgroundColor: isDisabled ? '#FFF7E8' : stylesVars.inputBg,
              borderColor,
              color: isDisabled ? Colors.textFieldPlaceholder : stylesVars.textPrimary,
              opacity: isDisabled ? 0.7 : 1,
            },
          ]}
        />
      )}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

const stylesVars = {
  textPrimary: Colors.naturalBlack,
  placeholder: Colors.textFieldPlaceholder,
  inputBg: Colors.textFieldBackground,
  inputBorder: 'rgba(71, 67, 66, 0.2)',
};

const styles = StyleSheet.create({
  field: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: FontFamilies.ownersRegular,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
  },
  inputRow: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    paddingLeft: 18,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
  },
  eyeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 20,
    height: 20,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: '#DC3545', // Red color for errors
  },
});

