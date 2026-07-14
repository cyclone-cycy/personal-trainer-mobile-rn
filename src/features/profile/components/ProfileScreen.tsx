import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { Avatar, ImagePreviewModal, LogoRefreshScrollView, Typography } from '@/shared/components';
import { useStatusBarStyle } from '@/shared/hooks/useStatusBarStyle';
import { fonts, palette, useTheme } from '@/shared/theme';

import { usePickAndUploadAvatar } from '../hooks/usePickAndUploadAvatar';
import { useProfile } from '../hooks/useProfile';
import { ProfileApiBanner } from './ProfileApiBanner';
import { ScreenHeader } from './ScreenHeader';
import { SettingsRow } from './SettingsRow';

const LOGO = require('../../../../assets/images/logo.png');
const PROFILE_FOCUS_LOAD_MS = 450;

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { isDark, setMode, colors } = useTheme();
  const statusBarStyle = useStatusBarStyle();
  const { pick: pickAvatar, isUploading } = usePickAndUploadAvatar();
  const hasUser = Boolean(user);

  // Pull fresh profile data on mount; the hook also syncs the auth store
  // so the rest of the UI reads from useAuthStore as before.
  const { refetch, isError, isLoading, isRefetching } = useProfile();
  const [isFocusLoading, setIsFocusLoading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const navigate = (path: string) => () => router.push(path as never);

  useFocusEffect(
    useCallback(() => {
      // We already have the user cached from a previous load — revalidate
      // quietly in the background with no spinner so returning to this screen
      // (e.g. pressing back from Account Settings) is instant.
      if (hasUser) {
        refetch();
        return;
      }

      // Cold load with nothing cached — show the focus loader while we fetch,
      // capped at PROFILE_FOCUS_LOAD_MS so it never lingers.
      let isActive = true;
      setIsFocusLoading(true);
      const timer = setTimeout(() => {
        if (isActive) setIsFocusLoading(false);
      }, PROFILE_FOCUS_LOAD_MS);

      refetch().finally(() => {
        if (isActive) setIsFocusLoading(false);
      });

      return () => {
        isActive = false;
        clearTimeout(timer);
        setIsFocusLoading(false);
      };
    }, [hasUser, refetch]),
  );

  const showBlockingLoader = isLoading && !hasUser;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={statusBarStyle} />

      <LogoRefreshScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching || isFocusLoading}
        onRefresh={refetch}
      >
        <Animated.View entering={FadeInDown.duration(360)}>
          <ScreenHeader title="Profile Settings" />
        </Animated.View>

        {isError ? (
          <Animated.View entering={FadeIn.duration(240)} style={styles.bannerWrap}>
            <ProfileApiBanner onRetry={refetch} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeIn.delay(80).duration(360)} style={styles.profileBlock}>
          <Avatar
            name={user?.name}
            uri={user?.avatarUrl}
            size={84}
            loading={isUploading}
            onPress={() => (user?.avatarUrl ? setPreviewIndex(0) : pickAvatar())}
            onBadgePress={pickAvatar}
            accessibilityLabel="View profile picture"
            badgeIcon={<Ionicons name="pencil" size={11} color="#FFFFFF" />}
          />
          <Typography style={[styles.name, { color: colors.text, marginTop: 10 }]}>
            {user?.name ?? 'Member'}
          </Typography>
          <Typography style={[styles.email, { color: colors.textSecondary }]}>
            {user?.email ?? '—'}
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140).duration(360)} style={styles.section}>
          <Typography style={[styles.sectionTitle, { color: colors.text }]}>
            General Settings
          </Typography>
          <SettingsRow
            icon={<Ionicons name="settings-outline" size={18} color={colors.icon} />}
            label="Account Settings"
            onPress={navigate('/account-settings')}
          />
          <SettingsRow
            icon={<Ionicons name="person-outline" size={18} color={colors.icon} />}
            label="Personal Information"
            onPress={navigate('/personal-information')}
          />
          <SettingsRow
            icon={<Ionicons name="moon-outline" size={18} color={colors.icon} />}
            label="App Appearance"
            rightSlot={
              <Switch
                value={isDark}
                onValueChange={(v) => setMode(v ? 'dark' : 'light')}
                trackColor={{ false: palette.neutral['2'], true: palette.highlightBlue['5'] }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={palette.neutral['2']}
              />
            }
          />
          <SettingsRow
            icon={<Ionicons name="eye-outline" size={18} color={colors.icon} />}
            label="Privacy Policy"
            onPress={navigate('/privacy-policy')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(360)} style={styles.section}>
          <Typography style={[styles.sectionTitle, { color: colors.text }]}>
            Preferences and Subscriptions
          </Typography>
          <SettingsRow
            icon={<Ionicons name="barbell-outline" size={18} color={colors.icon} />}
            label="Fitness Goals & Preferences"
            onPress={navigate('/fitness-preferences')}
          />
          <SettingsRow
            icon={<Ionicons name="notifications-outline" size={18} color={colors.icon} />}
            label="Notifications & Reminders"
            onPress={navigate('/notifications')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(260).duration(360)} style={styles.section}>
          <Typography style={[styles.sectionTitle, { color: colors.text }]}>Support</Typography>
          {/*
            Contact Us is intentionally hidden for now.
            Restore this row when the support/contact experience is ready.
          */}
          {/*
            <SettingsRow
              icon={<Ionicons name="chatbubble-outline" size={18} color={colors.icon} />}
              label="Contact Us"
              onPress={navigate('/contact-us')}
            />
          */}
          <SettingsRow
            icon={<Ionicons name="help-circle-outline" size={18} color={colors.icon} />}
            label="FAQ"
            onPress={navigate('/faq')}
          />
        </Animated.View>
      </LogoRefreshScrollView>
      {showBlockingLoader ? <ProfileLoadingOverlay /> : null}
      <ImagePreviewModal
        images={user?.avatarUrl ? [{ id: 'profile-picture', imageUrl: user.avatarUrl }] : []}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
      />
    </SafeAreaView>
  );
}

function ProfileLoadingOverlay() {
  const { colors } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1100,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      pointerEvents="auto"
      style={[styles.loadingOverlay, { backgroundColor: colors.background }]}
    >
      <Animated.Image source={LOGO} style={[styles.loadingLogo, logoStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  loadingLogo: {
    width: 58,
    height: 58,
    resizeMode: 'contain',
  },
  profileBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 18,
  },
  bannerWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  email: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
});
