import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { PLATFORM_LOGOS } from '@/features/book-a-call/data/platform-logos';
import { outreachOption, outreachRequires } from '@/features/bookings';
import { Trainer } from '@/features/trainers/types/trainer.types';
import { Button, toPhoneE164, Typography } from '@/shared/components';
import { useTheme } from '@/shared/theme';

import { SessionDraft } from '../types/book-a-session.types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Shown before the user confirms so the reschedule window is clear up front.
const RESCHEDULE_POLICY = 'You can reschedule this session up to 12 hours before the start time.';

function formatDate(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function addOneHour(time: string): string {
  const [rawTime, period] = time.trim().split(/\s+/);
  let [h] = rawTime.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  h += 1;
  const nextPeriod = h >= 12 && h < 24 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:00 ${nextPeriod}`;
}

interface SummaryStepProps {
  trainer: Trainer;
  draft: SessionDraft;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function SummaryStep({
  trainer,
  draft,
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: SummaryStepProps) {
  const { colors, spacing, isDark } = useTheme();
  const glassSurface = isDark ? 'rgba(0,0,0,0.48)' : 'rgba(255,255,255,0.78)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.58)';

  const platform = draft.platform!;
  const option = outreachOption(platform);
  const requires = outreachRequires(platform);
  const date = draft.date!;
  const time = draft.time!;
  const endTime = addOneHour(time);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(360)}>
          <Typography variant="h2" color="#FFFFFF" style={styles.heading}>
            Review Your Booking
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.74)" style={styles.subtitle}>
            Please review the details below and confirm.
          </Typography>
        </Animated.View>

        {/* Trainer card */}
        <Animated.View
          entering={FadeInUp.delay(80).duration(360)}
          style={[styles.trainerCard, { backgroundColor: glassSurface, borderColor: glassBorder }]}
        >
          <Image source={{ uri: trainer.image }} style={styles.trainerAvatar} />
          <View style={styles.trainerInfo}>
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
            <Typography variant="body2" color={colors.primary} style={styles.specialty}>
              {trainer.specialty}
            </Typography>
          </View>
        </Animated.View>

        {/* Details card */}
        <Animated.View
          entering={FadeInUp.delay(160).duration(360)}
          style={[styles.detailsCard, { backgroundColor: glassSurface, borderColor: glassBorder }]}
        >
          {[
            {
              icon: 'calendar-outline' as const,
              label: 'Date',
              value: formatDate(date),
              valueNode: null,
            },
            {
              icon: 'time-outline' as const,
              label: 'Time',
              value: `${time} - ${endTime}`,
              valueNode: null,
            },
            {
              icon: 'timer-outline' as const,
              label: 'Duration',
              value: '60 mins',
              valueNode: null,
            },
            {
              icon: option?.icon ?? ('videocam-outline' as const),
              label: 'Platform',
              value: null,
              valueNode: (
                <View style={styles.platformValueRow}>
                  {option?.usesZoomLogo ? (
                    <Image
                      source={PLATFORM_LOGOS.zoom}
                      style={styles.platformValueLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons
                      name={option?.icon ?? 'videocam-outline'}
                      size={18}
                      color={colors.primary}
                    />
                  )}
                  <Typography variant="body2" color={colors.textSecondary}>
                    {option?.name ?? platform}
                  </Typography>
                </View>
              ),
            },
            ...(requires === 'phone' && draft.phoneNumber.trim()
              ? [
                  {
                    icon: 'call-outline' as const,
                    label: 'Phone',
                    value:
                      toPhoneE164(draft.phoneNumber, draft.phoneCountry) ??
                      draft.phoneNumber.trim(),
                    valueNode: null,
                  },
                ]
              : []),
            ...(requires === 'messenger' && draft.messengerHandle.trim()
              ? [
                  {
                    icon: 'logo-facebook' as const,
                    label: 'Messenger',
                    value: draft.messengerHandle.trim(),
                    valueNode: null,
                  },
                ]
              : []),
          ].map(({ icon, label, value, valueNode }, idx, arr) => (
            <View
              key={label}
              style={[
                styles.detailRow,
                idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.detailLeft}>
                <Ionicons
                  name={icon}
                  size={18}
                  color={colors.textSecondary}
                  style={styles.detailIcon}
                />
                <Typography variant="body2" color={colors.text}>
                  {label}
                </Typography>
              </View>
              {valueNode ?? (
                <Typography variant="body2" color={colors.textSecondary}>
                  {value}
                </Typography>
              )}
            </View>
          ))}
        </Animated.View>

        {/* Reschedule policy — surfaced before confirming */}
        <Animated.View
          entering={FadeInUp.delay(220).duration(360)}
          style={[styles.policyBanner, { backgroundColor: glassSurface, borderColor: glassBorder }]}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.primary}
            style={styles.policyIcon}
          />
          <Typography variant="body2" color={colors.primary} style={styles.policyText}>
            {RESCHEDULE_POLICY}
          </Typography>
        </Animated.View>

        {errorMessage ? (
          <Animated.View
            entering={FadeInUp.duration(260)}
            style={[styles.errorBanner, { backgroundColor: colors.error + '14' }]}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Typography variant="body2" color={colors.error} style={styles.errorText}>
              {errorMessage}
            </Typography>
          </Animated.View>
        ) : null}

        <View style={styles.footerSpacer} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.lg,
          },
        ]}
      >
        <Button
          label="Confirm Booking"
          isLoading={isSubmitting}
          onPress={onSubmit}
          style={[styles.glassButton, { backgroundColor: colors.primary }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: 8, paddingBottom: 16 },
  heading: { fontWeight: '700', marginBottom: 6 },
  subtitle: { marginBottom: 24 },
  trainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  trainerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  trainerInfo: { flex: 1 },
  trainerNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  trainerName: { fontWeight: '700', marginRight: 6 },
  verifiedIcon: {},
  specialty: { fontSize: 13 },
  detailsCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { marginRight: 10 },
  platformValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  platformValueLogo: { width: 20, height: 20 },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  policyIcon: { marginTop: 1 },
  policyText: { flex: 1, lineHeight: 20 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  errorText: { flex: 1, lineHeight: 20 },
  footerSpacer: { height: 8 },
  footer: { paddingTop: 12 },
  glassButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
});
