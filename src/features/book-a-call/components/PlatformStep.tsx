import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { OUTREACH_OPTIONS, outreachRequires } from '@/features/bookings';
import { Trainer } from '@/features/trainers/types/trainer.types';
import { Button, isPhoneComplete, PhoneInput, TextInput, Typography } from '@/shared/components';
import { palette, useTheme } from '@/shared/theme';

import { PLATFORM_LOGOS } from '../data/platform-logos';
import { CallDraft } from '../types/book-a-call.types';

const AGENT_BULLETS = [
  'Answer any questions you have about FitCall',
  'Walk you through how sessions work',
  "Guide you through getting started if you're ready",
];

interface PlatformStepProps {
  trainer: Trainer;
  draft: CallDraft;
  onUpdate: (patch: Partial<CallDraft>) => void;
  onContinue: () => void;
}

export function PlatformStep({ trainer, draft, onUpdate, onContinue }: PlatformStepProps) {
  const { colors, spacing, isDark } = useTheme();
  const glassSurface = isDark ? 'rgba(0,0,0,0.48)' : 'rgba(255,255,255,0.78)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.46)';
  const requires = draft.contactMode ? outreachRequires(draft.contactMode) : null;
  const requiresPhone = requires === 'phone';
  const requiresMessenger = requires === 'messenger';
  const phoneValid = isPhoneComplete(draft.phoneNumber, draft.phoneCountry);
  const messengerValid = draft.messengerHandle.trim().length > 0;
  const canContinue =
    draft.contactMode !== null &&
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
        {/* Heading */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <Typography variant="h2" style={[styles.heading, { color: '#FFFFFF' }]}>
            Got questions? Let&apos;s answer them.
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.76)" style={styles.subtitle}>
            Choose how one of our agents should reach out to you.
          </Typography>
        </Animated.View>

        {/* Info card */}
        <Animated.View
          entering={FadeInUp.delay(80).duration(360)}
          style={[styles.card, { backgroundColor: glassSurface, borderColor: glassBorder }]}
        >
          <Typography variant="body2" style={styles.cardLabel}>
            On this call, our agent will:
          </Typography>
          {AGENT_BULLETS.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <Ionicons
                name="checkmark"
                size={14}
                color={palette.success['4']}
                style={styles.checkIcon}
              />
              <Typography variant="body2" color={colors.textSecondary} style={styles.bulletText}>
                {bullet}
              </Typography>
            </View>
          ))}
        </Animated.View>

        {/* Trainer / enquiring-about card */}
        <Animated.View
          entering={FadeInUp.delay(160).duration(360)}
          style={[styles.card, { backgroundColor: glassSurface, borderColor: glassBorder }]}
        >
          <Typography variant="body2" color={colors.primary} style={styles.enquiringLabel}>
            Enquiring about
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
                color={palette.success['4']}
                style={styles.verifiedIcon}
              />
            </View>
          </View>
        </Animated.View>

        {/* Contact mode selection */}
        <Animated.View entering={FadeInUp.delay(220).duration(360)}>
          <Typography variant="body1" style={styles.sectionHeader}>
            How should we contact you?
          </Typography>
        </Animated.View>

        {OUTREACH_OPTIONS.map((p, i) => {
          const selected = draft.contactMode === p.id;
          return (
            <Animated.View key={p.id} entering={FadeInUp.delay(280 + i * 60).duration(360)}>
              <Pressable
                onPress={() => onUpdate({ contactMode: p.id })}
                style={[
                  styles.platformCard,
                  {
                    backgroundColor: glassSurface,
                    borderColor: selected ? colors.primary : glassBorder,
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
                  <Typography variant="body1" style={styles.sectionHeader}>
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
                  <Typography variant="body1" style={styles.sectionHeader}>
                    Your Facebook Messenger handle
                  </Typography>
                  <TextInput
                    value={draft.messengerHandle}
                    onChangeText={(messengerHandle) => onUpdate({ messengerHandle })}
                    placeholder="jane.doe.42"
                    autoCapitalize="none"
                  />
                </Animated.View>
              )}
            </Animated.View>
          );
        })}

        {/* Info banner */}
        <Animated.View
          entering={FadeInUp.delay(560).duration(360)}
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
              ? 'Use the number where our team can reach you.'
              : requiresMessenger
                ? 'Our team will message this Messenger handle.'
                : 'We will send the meeting link before your discovery call.'}
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
          style={styles.glassButton}
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
    marginBottom: 12,
  },
  cardLabel: { fontWeight: '600', marginBottom: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  checkIcon: { marginRight: 8, marginTop: 1 },
  bulletText: { flex: 1, lineHeight: 20 },
  enquiringLabel: { fontSize: 13, fontWeight: '500', marginBottom: 10 },
  trainerRow: { flexDirection: 'row', alignItems: 'center' },
  trainerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  trainerNameRow: { flexDirection: 'row', alignItems: 'center' },
  trainerName: { fontWeight: '700', marginRight: 6 },
  verifiedIcon: {},
  // Pulls the revealed input up against the selected card so it reads as
  // attached to that option, with room before the next card.
  inlineField: { marginTop: -4, marginBottom: 12 },
  sectionHeader: { fontWeight: '700', marginTop: 8, marginBottom: 12 },
  phoneInput: { fontSize: 15 },
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  infoIcon: { marginRight: 8, marginTop: 1 },
  infoText: { flex: 1, lineHeight: 20 },
  footerSpacer: { height: 128 },
  footer: { paddingTop: 12 },
  glassButton: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    borderRadius: 100,
  },
});
