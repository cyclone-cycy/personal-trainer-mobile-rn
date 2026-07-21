import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// DateTimeStep is identical between call and session bookings — reuse instead
// of duplicating. SessionDraft is structurally equivalent to CallDraft.
import { DateTimeStep } from '@/features/book-a-call/components/DateTimeStep';
import {
  getTimezone,
  getTrainerAvailabilityDates,
  outreachRequires,
  sessionPlatformFor,
  useCreateSessionBooking,
  useUpcomingBookings,
} from '@/features/bookings';
import { trainers } from '@/features/trainers/data/trainers.data';
import { useTrainer } from '@/features/trainers/hooks/useTrainer';
import { useTrainerAvailability } from '@/features/trainers/hooks/useTrainerAvailability';
import { ApiError } from '@/shared/api/types';
import { toPhoneE164, Typography } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { buildLocalDateTimeIso } from '@/shared/utils/dateTime';

import { PlatformStep } from '../components/PlatformStep';
import { SuccessView } from '../components/SuccessView';
import { SummaryStep } from '../components/SummaryStep';
import { SessionDraft } from '../types/book-a-session.types';

type Step = 1 | 2 | 3 | 'success';

const STEP_DURATION = 320;

export function BookASessionScreen() {
  const { colors, spacing } = useTheme();
  const { trainerId } = useLocalSearchParams<{ trainerId?: string }>();
  const { data: fetchedTrainer, isLoading: isTrainerLoading } = useTrainer(trainerId);
  const {
    data: trainerAvailability = [],
    isLoading: isLoadingAvailability,
    isError: isErrorAvailability,
    isRefetching: isRefetchingAvailability,
    refetch: refetchAvailability,
  } = useTrainerAvailability(trainerId);
  const trainer = fetchedTrainer ?? (!trainerId ? trainers[0] : undefined);
  const timezone = getTimezone();
  const {
    data: upcomingBookings = [],
    isLoading: isLoadingUpcomingBookings,
    isError: isErrorUpcoming,
    isRefetching: isRefetchingUpcoming,
    refetch: refetchUpcoming,
  } = useUpcomingBookings({
    timezone,
    type: 'session',
    limit: 50,
  });
  // Require both queries to have settled WITHOUT error so a failed fetch
  // doesn't masquerade as "no remote availability" in the time grid.
  const areSlotsReady =
    !isLoadingUpcomingBookings &&
    !isLoadingAvailability &&
    !isErrorAvailability &&
    !isErrorUpcoming;
  // Memoized so tapping a date (which re-renders this screen) doesn't hand
  // DateTimeStep a fresh array every render and churn its derived slot memos.
  const availableSlotDates = useMemo(
    () => getTrainerAvailabilityDates(trainerAvailability, upcomingBookings),
    [trainerAvailability, upcomingBookings],
  );
  const createSessionBooking = useCreateSessionBooking();
  const isRefreshingSlots = isRefetchingAvailability || isRefetchingUpcoming;
  const refreshSlots = useCallback(async () => {
    await Promise.all([refetchAvailability(), refetchUpcoming()]);
  }, [refetchAvailability, refetchUpcoming]);

  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<SessionDraft>({
    platform: null,
    phoneNumber: '',
    phoneCountry: 'US',
    messengerHandle: '',
    date: null,
    time: null,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const direction = useRef<'forward' | 'backward'>('forward');

  const progress = useSharedValue(1 / 3);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  function updateDraft(patch: Partial<SessionDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleBack() {
    if (step === 1 || step === 'success') {
      router.back();
    } else {
      direction.current = 'backward';
      setStep(((step as number) - 1) as Step);
    }
  }

  function advance() {
    direction.current = 'forward';
    if (step === 3) {
      setStep('success');
    } else {
      setStep(((step as number) + 1) as Step);
    }
  }

  async function submitSessionBooking() {
    if (!trainer || !draft.platform || !draft.date || !draft.time) {
      return;
    }

    setSubmitError(null);

    const scheduledStart = buildSelectedDateTime(draft.date, draft.time);
    const scheduledEnd = new Date(new Date(scheduledStart).getTime() + 60 * 60_000).toISOString();
    // Only options carrying a `sessionPlatform` (zoom / google_meet / messenger
    // / whatsapp / imessage) reach the platform step, so this is always defined.
    const sessionPlatform = sessionPlatformFor(draft.platform);
    if (!sessionPlatform) {
      setSubmitError('This contact method is not available for session bookings.');
      return;
    }

    try {
      await createSessionBooking.mutateAsync({
        trainer_id: trainer.id,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        session_platform: sessionPlatform,
        timezone,
        ...(sessionPlatform === 'messenger'
          ? { messenger_handle: draft.messengerHandle.trim() }
          : {}),
        ...(outreachRequires(draft.platform) === 'phone' && draft.phoneNumber.trim()
          ? {
              phone_number:
                toPhoneE164(draft.phoneNumber, draft.phoneCountry) ?? draft.phoneNumber.trim(),
            }
          : {}),
      });
      advance();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not confirm your booking. Please try again.';
      setSubmitError(message);
    }
  }

  const isSuccess = step === 'success';
  const numericStep = isSuccess ? 3 : (step as number);
  const title = step === 3 ? 'Booking Summary' : 'Book a Session';

  useEffect(() => {
    progress.value = withTiming(numericStep / 3, { duration: 400 });
  }, [numericStep, progress]);

  if (isTrainerLoading || !trainer) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centered, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const entering = direction.current === 'forward' ? SlideInRight : SlideInLeft;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <Image source={{ uri: trainer.image }} style={styles.backgroundImage} />
      <View pointerEvents="none" style={styles.backgroundScrim} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.56)', 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0.88)', 'rgba(0,0,0,0.96)']}
        locations={[0, 0.32, 0.72, 1]}
        style={styles.backgroundShade}
      />
      {!isSuccess && (
        <Animated.View
          entering={FadeInDown.duration(360)}
          style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.sm }]}
        >
          <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Typography variant="h2" style={styles.headerTitle} color="#FFFFFF">
            {title}
          </Typography>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <Typography variant="body2" color="rgba(255,255,255,0.74)" style={styles.stepLabel}>
            Step {numericStep} of 3
          </Typography>
        </Animated.View>
      )}

      <Animated.View
        key={String(step)}
        entering={isSuccess ? FadeIn.duration(360) : entering.duration(STEP_DURATION)}
        style={styles.content}
      >
        {/*
          Date & Time is step 1 so an unavailable trainer surfaces immediately —
          the user shouldn't have to pick a call method before discovering there
          are no open slots. Call method (PlatformStep) follows on step 2.
        */}
        {step === 1 && (
          <DateTimeStep
            draft={draft}
            onUpdate={updateDraft}
            onContinue={advance}
            availableSlots={availableSlotDates}
            isLoadingSlots={!areSlotsReady}
            useRemoteSlots={areSlotsReady}
            onRefresh={refreshSlots}
            isRefreshing={isRefreshingSlots}
            glass
          />
        )}
        {step === 2 && (
          <PlatformStep
            trainer={trainer}
            draft={draft}
            onUpdate={updateDraft}
            onContinue={advance}
          />
        )}
        {step === 3 && (
          <SummaryStep
            trainer={trainer}
            draft={draft}
            onSubmit={submitSessionBooking}
            isSubmitting={createSessionBooking.isPending}
            errorMessage={submitError}
          />
        )}
        {step === 'success' && <SuccessView trainer={trainer} />}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 36 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  backgroundShade: {
    ...StyleSheet.absoluteFillObject,
  },
  header: { paddingBottom: 18 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontWeight: '700', marginBottom: 12 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  stepLabel: { marginBottom: 0 },
  content: { flex: 1 },
});

function buildSelectedDateTime(date: Date, time: string): string {
  return buildLocalDateTimeIso(date, time);
}
