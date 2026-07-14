import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { PLATFORM_LOGOS } from '@/features/book-a-call/data/platform-logos';
import { SESSION_OUTREACH_OPTIONS, outreachRequires } from '@/features/bookings';
import { Trainer } from '@/features/trainers/types/trainer.types';
import { Button, isPhoneComplete, PhoneInput, TextInput, Typography } from '@/shared/components';
import { useTheme } from '@/shared/theme';

import { SessionDraft } from '../types/book-a-session.types';

interface PlatformStepProps {
  trainer: Trainer;
  draft: SessionDraft;
  onUpdate: (patch: Partial<SessionDraft>) => void;
  onContinue: () => void;
}

export function PlatformStep({ trainer, draft, onUpdate, onContinue }: PlatformStepProps) {
  const { colors, spacing, isDark } = useTheme();
  const glassSurface = isDark ? 'rgba(0,0,0,0.48)' : 'rgba(255,255,255,0.78)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.58)';

  const requires = draft.platform ? outreachRequires(draft.platform) : null;
  const requiresPhone = requires === 'phone';
  const requiresMessenger = requires === 'messenger';
  const phoneValid = isPhoneComplete(draft.phoneNumber, draft.phoneCountry);
  const messengerValid = draft.messengerHandle.trim().length > 0;
  const canContinue =
    draft.platform !== null &&
    (!requiresPhone || phoneValid) &&
    (!requiresMessenger || messengerValid);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing.md }]}
        showsVerticalScrollIndicator={false}
        bottomOffset={112}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(360)}>
          <Typography variant="h2" color="#FFFFFF" style={styles.heading}>
            How should the session happen?
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.74)" style={styles.subtitle}>
            Pick how your trainer will reach you.
          </Typography>
        </Animated.View>

        {/* Trainer / booking-with card */}
        <Animated.View
          entering={FadeInUp.delay(80).duration(360)}
          style={[styles.card, { backgroundColor: glassSurface, borderColor: glassBorder }]}
        >
          <Typography variant="body2" color={colors.primary} style={styles.bookingLabel}>
            Booking session with
          </Typography>
          <View style={styles.trainerRow}>
            <Image source={{ uri: trainer.image }} style={styles.trainerAvatar} />
            <View style={styles.trainerNameRow}>
              <Typography variant="body1" style={styles.trainerName}>
                {trainer.name}
              </Typography>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
                style={styles.verifiedIcon}
              />
            </View>
          </View>
        </Animated.View>

        {SESSION_OUTREACH_OPTIONS.map((p, i) => {
          const selected = draft.platform === p.id;
          return (
            <Animated.View key={p.id} entering={FadeInUp.delay(160 + i * 60).duration(360)}>
              <Pressable
                onPress={() => onUpdate({ platform: p.id })}
                style={[
                  styles.platformCard,
                  {
                    backgroundColor: glassSurface,
                    borderColor: selected ? colors.primary : colors.border,
                    borderWidth: selected ? 1.5 : 1,
                  },
                ]}
              >
                <View style={styles.platformLogoBox}>
                  {p.usesZoomLogo ? (
                    <Image source={PLATFORM_LOGOS.zoom} style={styles.platformLogo} />
                  ) : (
                    <Ionicons name={p.icon} size={24} color={colors.primary} />
                  )}
                </View>
                <View style={styles.platformText}>
                  <Typography variant="body1" style={styles.platformName}>
                    {p.name}
                  </Typography>
                  <Typography variant="body2" color={colors.textSecondary}>
                    {p.description}
                  </Typography>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: selected ? colors.primary : colors.border },
                  ]}
                >
                  {selected && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </Pressable>

              {selected && p.requires === 'phone' && (
                <Animated.View entering={FadeInUp.duration(260)} style={styles.inlineField}>
                  <Typography variant="body1" style={styles.phoneLabel}>
                    Your phone number
                  </Typography>
                  <PhoneInput
                    value={draft.phoneNumber}
                    onChangeText={(phoneNumber) => onUpdate({ phoneNumber })}
                    country={draft.phoneCountry}
                    onCountryChange={(phoneCountry) => onUpdate({ phoneCountry, phoneNumber: '' })}
                    placeholder="555 123 4567"
                    style={styles.phoneInput}
                  />
                </Animated.View>
              )}

              {selected && p.requires === 'messenger' && (
                <Animated.View entering={FadeInUp.duration(260)} style={styles.inlineField}>
                  <Typography variant="body1" style={styles.phoneLabel}>
                    Your Facebook Messenger handle
                  </Typography>
                  <TextInput
                    value={draft.messengerHandle}
                    onChangeText={(messengerHandle) => onUpdate({ messengerHandle })}
                    placeholder="jane.doe.42"
                    autoCapitalize="none"
                    style={styles.messengerInput}
                  />
                </Animated.View>
              )}
            </Animated.View>
          );
        })}

        <Animated.View
          entering={FadeInUp.delay(360).duration(360)}
          style={[styles.infoBanner, { backgroundColor: glassSurface, borderColor: glassBorder }]}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.primary}
            style={styles.infoIcon}
          />
          <Typography variant="body2" color={colors.primary} style={styles.infoText}>
            {requiresPhone
              ? 'Use the number where your trainer can reach you at the booked time.'
              : requiresMessenger
                ? 'Your trainer will message this Messenger handle to set up the session.'
                : 'Your trainer will send the meeting link before your session.'}
          </Typography>
        </Animated.View>

        <View style={styles.footerSpacer} />
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
            justifyContent: 'flex-end',
          },
        ]}
      >
        <Button
          label="Continue"
          disabled={!canContinue}
          onPress={onContinue}
          style={[
            styles.glassButton,
            // Grey glass while no valid medium is picked; solid brand blue once
            // the selection is complete, so the button reads as actionable.
            { backgroundColor: canContinue ? colors.primary : 'rgba(255,255,255,0.16)' },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: 18, paddingBottom: 16 },
  heading: { fontWeight: '700', marginBottom: 6 },
  subtitle: { marginBottom: 20, lineHeight: 22 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  bookingLabel: { fontSize: 13, fontWeight: '500', marginBottom: 10 },
  trainerRow: { flexDirection: 'row', alignItems: 'center' },
  trainerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  trainerNameRow: { flexDirection: 'row', alignItems: 'center' },
  trainerName: { fontWeight: '700', marginRight: 6 },
  verifiedIcon: {},
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  platformLogoBox: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  platformText: { flex: 1 },
  platformName: { fontWeight: '600', marginBottom: 2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  // Pulls the revealed input up against the selected card (which has its own
  // marginBottom) so it reads as attached to that option.
  inlineField: { marginTop: -4, marginBottom: 4 },
  phoneLabel: { fontWeight: '700', marginTop: 4, marginBottom: 12 },
  phoneInput: { fontSize: 15, marginBottom: 12 },
  messengerInput: { marginBottom: 12 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  infoIcon: { marginRight: 8, marginTop: 1 },
  infoText: { flex: 1, lineHeight: 20 },
  footerSpacer: { height: 128 },
  footer: { paddingTop: 12 },
  glassButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
});
