import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  Avatar,
  Button,
  ImagePreviewModal,
  LogoRefreshScrollView,
  TextInput,
  toast,
  Typography,
} from '@/shared/components';
import { useStatusBarStyle } from '@/shared/hooks/useStatusBarStyle';
import { fonts, palette, useTheme } from '@/shared/theme';

import { useDeviceLocation } from '../hooks/useDeviceLocation';
import { usePickAndUploadAvatar } from '../hooks/usePickAndUploadAvatar';
import { useProfile } from '../hooks/useProfile';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { toApiFitnessGoals } from '../api/profile.types';
import { CenterModal } from './CenterModal';
import { InfoRow } from './InfoRow';
import { ProfileApiBanner } from './ProfileApiBanner';
import { ScreenHeader } from './ScreenHeader';

const MAX_GOALS = 4;

type Newsletter = 'yes' | 'no';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

const FITNESS_GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'improve_flexibility', legacyValue: 'flexibility', label: 'Improve Flexibility' },
  { value: 'boost_energy', legacyValue: 'endurance', label: 'Boost Energy & Endurance' },
  { value: 'build_healthy_habits', legacyValue: 'habits', label: 'Build Healthy Habits' },
  { value: 'build_strength', legacyValue: 'strength', label: 'Build Strength' },
] as const;

const FITNESS_LEVEL_OPTIONS = [
  { value: 'beginner', legacyValue: 'easy', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', legacyValue: 'challenging', label: 'Advanced' },
] as const;

function titleCase(value: string) {
  return value.replace(
    /(^|[\s_])([a-z])/g,
    (_, sep, ch) => `${sep === '_' ? ' ' : sep}${ch.toUpperCase()}`,
  );
}

export function PersonalInformationScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: location, status: locationStatus, refresh: refreshLocation } = useDeviceLocation();
  const { colors } = useTheme();
  const statusBarStyle = useStatusBarStyle();
  const { pick: pickAvatar, isUploading } = usePickAndUploadAvatar();
  const { refetch, isError, isRefetching } = useProfile();
  const updateProfile = useUpdateProfile();

  const [newsletter, setNewsletter] = useState<Newsletter>('yes');
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(user?.name ?? '');
  const [draftGender, setDraftGender] = useState<string | null>(user?.gender ?? null);
  const [draftGoals, setDraftGoals] = useState<string[]>(normalizeGoals(user?.fitnessGoals ?? []));
  const [draftFitnessLevel, setDraftFitnessLevel] = useState<string | null>(
    normalizeFitnessLevel(user?.fitnessLevel),
  );

  useEffect(() => {
    if (isEditing) return;
    setDraftName(user?.name ?? '');
    setDraftGender(user?.gender ?? null);
    setDraftGoals(normalizeGoals(user?.fitnessGoals ?? []));
    setDraftFitnessLevel(normalizeFitnessLevel(user?.fitnessLevel));
  }, [isEditing, user?.fitnessGoals, user?.fitnessLevel, user?.gender, user?.name]);

  const locationLabel =
    location?.country ||
    (locationStatus === 'loading'
      ? 'Locating...'
      : locationStatus === 'denied'
        ? 'Off'
        : locationStatus === 'error'
          ? '-'
          : '-');
  const goals = user?.fitnessGoals?.filter(Boolean) ?? [];

  const cancelEdit = () => {
    setDraftName(user?.name ?? '');
    setDraftGender(user?.gender ?? null);
    setDraftGoals(normalizeGoals(user?.fitnessGoals ?? []));
    setDraftFitnessLevel(normalizeFitnessLevel(user?.fitnessLevel));
    setIsEditing(false);
  };

  const toggleGoal = (goal: string) => {
    setDraftGoals((current) => {
      if (current.includes(goal)) return current.filter((item) => item !== goal);
      if (current.length >= MAX_GOALS) {
        toast.error(`Pick up to ${MAX_GOALS} goals.`);
        return current;
      }
      return [...current, goal];
    });
  };

  const saveProfile = () => {
    const name = draftName.trim();
    if (name.length < 2) {
      toast.error('Enter your full name before saving.');
      return;
    }

    updateProfile.mutate(
      {
        name,
        gender: draftGender,
        fitness_goals: toApiFitnessGoals(draftGoals),
        ...(draftFitnessLevel ? { fitness_level: draftFitnessLevel } : {}),
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success('Profile updated.');
        },
        onError: () => {
          toast.error("We couldn't update your profile. Please try again.");
        },
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={statusBarStyle} />

      <LogoRefreshScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
      >
        <Animated.View entering={FadeIn.duration(280)}>
          <ScreenHeader title="Personal Information" />
        </Animated.View>

        {isError ? (
          <Animated.View entering={FadeIn.duration(240)} style={styles.bannerWrap}>
            <ProfileApiBanner onRetry={refetch} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeIn.delay(80).duration(360)} style={styles.avatarBlock}>
          <Avatar
            name={user?.name}
            uri={user?.avatarUrl}
            size={76}
            loading={isUploading}
            onPress={() => (user?.avatarUrl ? setPreviewIndex(0) : pickAvatar())}
            onBadgePress={pickAvatar}
            accessibilityLabel="View profile picture"
            badgeIcon={<Ionicons name="camera" size={11} color="#FFFFFF" />}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140).duration(360)} style={styles.list}>
          <View style={styles.editHeader}>
            <Typography style={[styles.sectionTitle, { color: colors.text }]}>Profile</Typography>
            <Pressable
              onPress={isEditing ? cancelEdit : () => setIsEditing(true)}
              hitSlop={8}
              disabled={updateProfile.isPending}
              style={styles.editBtn}
            >
              <Typography style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Typography>
            </Pressable>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                label="Name"
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Your name"
                textContentType="name"
                autoCapitalize="words"
              />
              {user?.email ? <InfoRow label="Email" value={user.email} /> : null}

              <EditableOptions
                label="Gender"
                options={GENDER_OPTIONS}
                selected={draftGender ? [draftGender] : []}
                onPress={(value) => setDraftGender(value)}
              />
              <EditableOptions
                label="Goals"
                options={FITNESS_GOAL_OPTIONS}
                selected={draftGoals}
                onPress={toggleGoal}
                multi
              />
              <EditableOptions
                label="Fitness Level"
                options={FITNESS_LEVEL_OPTIONS}
                selected={draftFitnessLevel ? [draftFitnessLevel] : []}
                onPress={(value) => setDraftFitnessLevel(value)}
              />
              <Button
                label="Save Changes"
                onPress={saveProfile}
                isLoading={updateProfile.isPending}
                disabled={updateProfile.isPending}
              />
            </View>
          ) : (
            <>
              {user?.name ? <InfoRow label="Name" value={user.name} /> : null}
              {user?.email ? <InfoRow label="Email" value={user.email} /> : null}
              {user?.gender ? <InfoRow label="Gender" value={titleCase(user.gender)} /> : null}
              {goals.length ? (
                <InfoRow label="Goals" value={goals.map((goal) => titleCase(goal)).join(', ')} />
              ) : null}
              {user?.fitnessLevel ? (
                <InfoRow label="Fitness Level" value={titleCase(user.fitnessLevel)} />
              ) : null}
            </>
          )}
          <InfoRow
            label="Newsletter"
            value={newsletter === 'yes' ? 'Yes' : 'No'}
            onPress={() => setShowNewsletter(true)}
          />
          <InfoRow label="Location" value={locationLabel} onPress={() => setShowLocation(true)} />
        </Animated.View>
      </LogoRefreshScrollView>

      <CenterModal
        visible={showNewsletter}
        onClose={() => setShowNewsletter(false)}
        title="Newsletter"
      >
        <RadioOption
          label="Yes"
          selected={newsletter === 'yes'}
          onPress={() => {
            setNewsletter('yes');
            setShowNewsletter(false);
          }}
        />
        <RadioOption
          label="No"
          selected={newsletter === 'no'}
          onPress={() => {
            setNewsletter('no');
            setShowNewsletter(false);
          }}
        />
      </CenterModal>

      <CenterModal visible={showLocation} onClose={() => setShowLocation(false)} title="Location">
        {locationStatus === 'ready' && location ? (
          <>
            <View style={styles.locationRow}>
              <Typography style={[styles.locationLabel, { color: colors.text }]}>
                Country
              </Typography>
              <Typography style={[styles.locationValue, { color: colors.textMuted }]}>
                {location.country || '-'}
              </Typography>
            </View>
            <View style={styles.locationRow}>
              <Typography style={[styles.locationLabel, { color: colors.text }]}>
                City/State
              </Typography>
              <Typography style={[styles.locationValue, { color: colors.textMuted }]}>
                {location.cityState || '-'}
              </Typography>
            </View>
            <View style={styles.locationRow}>
              <Typography style={[styles.locationLabel, { color: colors.text }]}>
                Time Zone
              </Typography>
              <Typography style={[styles.locationValue, { color: colors.textMuted }]}>
                {location.timeZone}
              </Typography>
            </View>
          </>
        ) : (
          <View style={styles.locationFallback}>
            {locationStatus === 'loading' ? (
              <Typography style={[styles.locationHelp, { color: colors.textMuted }]}>
                Reading device location...
              </Typography>
            ) : locationStatus === 'denied' ? (
              <>
                <Typography style={[styles.locationHelp, { color: colors.textMuted }]}>
                  Location permission denied. Enable it in your device settings to see where you
                  are.
                </Typography>
                <Pressable onPress={refreshLocation} style={styles.retryBtn} hitSlop={6}>
                  <Typography style={styles.retryText}>Try again</Typography>
                </Pressable>
              </>
            ) : (
              <>
                <Typography style={[styles.locationHelp, { color: colors.textMuted }]}>
                  Couldn&apos;t read your location.
                </Typography>
                <Pressable onPress={refreshLocation} style={styles.retryBtn} hitSlop={6}>
                  <Typography style={styles.retryText}>Try again</Typography>
                </Pressable>
              </>
            )}
          </View>
        )}
      </CenterModal>
      <ImagePreviewModal
        images={user?.avatarUrl ? [{ id: 'profile-picture', imageUrl: user.avatarUrl }] : []}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
      />
    </SafeAreaView>
  );
}

function EditableOptions({
  label,
  options,
  selected,
  onPress,
  multi = false,
}: {
  label: string;
  options: readonly { value: string; legacyValue?: string; label: string }[];
  selected: string[];
  onPress: (value: string) => void;
  multi?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.editGroup}>
      <Typography style={[styles.editLabel, { color: colors.text }]}>{label}</Typography>
      <View style={styles.chipGrid}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => onPress(option.value)}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityState={{ selected: isSelected, checked: isSelected }}
              style={({ pressed }) => [
                styles.optionChip,
                {
                  backgroundColor: isSelected ? palette.highlightBlue['0.5'] : colors.background,
                  borderColor: isSelected ? palette.highlightBlue['5'] : colors.divider,
                },
                pressed && { opacity: 0.82 },
              ]}
            >
              <Typography
                style={[
                  styles.optionText,
                  { color: isSelected ? palette.highlightBlue['7'] : colors.textMuted },
                ]}
              >
                {option.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function normalizeGoals(goals: string[]) {
  return goals
    .map((goal) => {
      const option = FITNESS_GOAL_OPTIONS.find(
        (item) =>
          item.value === goal ||
          ('legacyValue' in item && item.legacyValue === goal) ||
          (item.value === 'boost_energy' && goal === 'boost_endurance'),
      );
      return option?.value ?? goal;
    })
    .filter(Boolean);
}

function normalizeFitnessLevel(level: string | null | undefined) {
  if (!level) return null;
  const option = FITNESS_LEVEL_OPTIONS.find(
    (item) => item.value === level || ('legacyValue' in item && item.legacyValue === level),
  );
  return option?.value ?? level;
}

interface RadioOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function RadioOption({ label, selected, onPress }: RadioOptionProps) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.radioRow} hitSlop={6}>
      <View
        style={[
          styles.radioOuter,
          { borderColor: selected ? palette.highlightBlue['5'] : colors.border },
        ]}
      >
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Typography style={[styles.radioLabel, { color: colors.text }]}>{label}</Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  bannerWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  avatarBlock: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 10,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  editText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: palette.highlightBlue['5'],
  },
  editForm: {
    gap: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  editGroup: {
    gap: 8,
  },
  editLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.highlightBlue['5'],
  },
  radioLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  locationValue: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: 'right',
  },
  locationFallback: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  locationHelp: {
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: palette.highlightBlue['5'],
  },
  editBtn: {
    backgroundColor: palette.highlightBlue['5'] + '20',
    paddingHorizontal: 16,
    borderRadius: 40,
    paddingVertical: 4,
  },
});
