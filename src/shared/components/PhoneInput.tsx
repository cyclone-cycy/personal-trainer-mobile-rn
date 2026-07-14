import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps,
  View,
} from 'react-native';

import { fonts, useTheme } from '@/shared/theme';

import { countryFlag, PHONE_COUNTRIES, type PhoneCountryMeta } from './phoneCountries';
import { Typography } from './Typography';

// Any ISO 3166-1 alpha-2 country code (see phoneCountries.ts). Kept as a string
// rather than a closed union so the picker is open to every country.
export type PhoneCountry = string;

// E.164 caps a full international number at 15 digits (country code included),
// so the national part can be at most 15 minus the dial-code digits. National
// number lengths vary by country and even within a country, so instead of a
// fixed per-country length we validate against this range: at least
// MIN_NATIONAL_DIGITS, at most the E.164 ceiling.
const MAX_E164_DIGITS = 15;
const MIN_NATIONAL_DIGITS = 4;
const DEFAULT_COUNTRY: PhoneCountry = 'US';

function metaFor(country: PhoneCountry): PhoneCountryMeta {
  return (
    PHONE_COUNTRIES.find((c) => c.code === country) ??
    PHONE_COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY) ??
    PHONE_COUNTRIES[0]
  );
}

function dialCodeDigits(dialCode: string): number {
  return dialCode.replace(/\D/g, '').length;
}

/** Max number of national digits allowed for a country under E.164. */
export function getPhoneNationalLength(country: PhoneCountry): number {
  return MAX_E164_DIGITS - dialCodeDigits(metaFor(country).dialCode);
}

export function isPhoneComplete(digits: string, country: PhoneCountry): boolean {
  return digits.length >= MIN_NATIONAL_DIGITS && digits.length <= getPhoneNationalLength(country);
}

// Build an E.164-formatted number from digits + selected country. Returns null
// when the number isn't valid so callers can short-circuit submission.
export function toPhoneE164(digits: string, country: PhoneCountry): string | null {
  if (!isPhoneComplete(digits, country)) return null;
  return `${metaFor(country).dialCode}${digits}`;
}

interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (digits: string) => void;
  country: PhoneCountry;
  onCountryChange: (country: PhoneCountry) => void;
  label?: string;
  error?: string;
}

export function PhoneInput({
  value,
  onChangeText,
  country,
  onCountryChange,
  label,
  error,
  style,
  ...props
}: PhoneInputProps) {
  const { colors } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const meta = metaFor(country);
  const maxDigits = getPhoneNationalLength(country);
  const hasError = !!error;

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    const digits = q.replace(/\D/g, '');
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (digits.length > 0 && c.dialCode.replace(/\D/g, '').includes(digits)),
    );
  }, [search]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, maxDigits);
    onChangeText(digits);
  };

  const openPicker = () => {
    setSearch('');
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setSearch('');
  };

  const handlePick = (next: PhoneCountry) => {
    closePicker();
    if (next === country) return;
    const nextMax = getPhoneNationalLength(next);
    if (value.length > nextMax) onChangeText(value.slice(0, nextMax));
    onCountryChange(next);
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Typography style={[styles.label, { color: colors.text }]}>{label}</Typography>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: hasError ? colors.error : colors.border,
            backgroundColor: colors.inputBackground,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Country code, currently ${meta.label}`}
          onPress={openPicker}
          style={[styles.countryPill, { borderRightColor: colors.border }]}
          hitSlop={6}
        >
          <Typography style={styles.flag}>{countryFlag(meta.code)}</Typography>
          <Typography style={[styles.dialCode, { color: colors.text }]}>{meta.dialCode}</Typography>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </Pressable>
        <RNTextInput
          value={value}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={maxDigits}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }, style]}
          {...props}
        />
      </View>
      {error ? (
        <Typography style={[styles.errorText, { color: colors.error }]}>{error}</Typography>
      ) : null}

      <Modal transparent visible={pickerVisible} animationType="fade" onRequestClose={closePicker}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlayFill}
        >
          <View style={[styles.overlay, { backgroundColor: colors.modalBackdrop }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />
            <View style={[styles.sheet, { backgroundColor: colors.background }]}>
              <Typography style={[styles.sheetTitle, { color: colors.text }]}>
                Select country
              </Typography>
              <View
                style={[
                  styles.searchWrapper,
                  { borderColor: colors.border, backgroundColor: colors.inputBackground },
                ]}
              >
                <Ionicons name="search" size={16} color={colors.textSecondary} />
                <RNTextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search countries"
                  placeholderTextColor={colors.textSecondary}
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={[styles.searchInput, { color: colors.text }]}
                />
              </View>
              <FlatList
                data={filteredCountries}
                keyExtractor={(c) => c.code}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                initialNumToRender={16}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Typography style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No countries match “{search.trim()}”.
                  </Typography>
                }
                renderItem={({ item: c }) => {
                  const selected = c.code === country;
                  return (
                    <Pressable
                      onPress={() => handlePick(c.code)}
                      style={({ pressed }) => [
                        styles.optionRow,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primarySubtle : colors.background,
                        },
                        pressed && styles.optionRowPressed,
                      ]}
                    >
                      <Typography style={styles.optionFlag}>{countryFlag(c.code)}</Typography>
                      <View style={styles.optionTextWrap}>
                        <Typography style={[styles.optionLabel, { color: colors.text }]}>
                          {c.label}
                        </Typography>
                        <Typography style={[styles.optionDial, { color: colors.textSecondary }]}>
                          {c.dialCode}
                        </Typography>
                      </View>
                      {selected ? (
                        <Ionicons name="checkmark" size={18} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
    borderRightWidth: 1,
  },
  flag: {
    fontSize: 18,
  },
  dialCode: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: 'right',
  },
  overlayFill: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sheetTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
    paddingVertical: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  optionRowPressed: {
    opacity: 0.78,
  },
  optionFlag: {
    fontSize: 22,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  optionDial: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
});
