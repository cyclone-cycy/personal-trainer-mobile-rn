import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { fonts, palette, useTheme } from '@/shared/theme';

export const HERO_GRADIENT: readonly [string, string, string] = [
  '#1B3F75',
  '#0F2E5C',
  '#081F40',
] as const;

export function useHomeStyles() {
  const { colors } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        body: {
          paddingBottom: 24,
        },
        backgroundLayer: {
          ...StyleSheet.absoluteFillObject,
          overflow: 'hidden',
        },
        backgroundTrainerImage: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: -36,
          width: '122%',
          height: '100%',
          opacity: 0.18,
        },
        backgroundWash: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.background,
          opacity: 0.7,
        },
        backgroundGradient: {
          ...StyleSheet.absoluteFillObject,
        },
        loadingContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        loadingLogo: {
          width: 72,
          height: 72,
          resizeMode: 'contain',
        },
        inlineLoadingLogo: {
          width: 42,
          height: 42,
          resizeMode: 'contain',
          marginBottom: 10,
        },
        refreshVeil: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 8,
          backgroundColor: colors.background,
        },
        refreshLogoLayer: {
          position: 'absolute',
          top: 28,
          left: 0,
          right: 0,
          zIndex: 10,
          alignItems: 'center',
        },
        refreshLogo: {
          width: 42,
          height: 42,
          resizeMode: 'contain',
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
        },
        greeting: {
          fontSize: 16,
          fontFamily: fonts.semibold,
          color: colors.text,
        },
        userName: {
          fontSize: 13,
          fontFamily: fonts.semibold,
          color: colors.textSecondary,
          marginTop: 2,
        },
        bellButton: {
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },

        // Hero — always dark gradient, white text in both themes
        heroCard: {
          borderRadius: 18,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 170,
          overflow: 'hidden',
        },
        heroLeft: {
          flex: 1,
          paddingRight: 8,
        },
        heroTitle: {
          fontSize: 19,
          fontFamily: fonts.bold,
          color: '#FFFFFF',
          lineHeight: 26,
        },
        heroText: {
          fontSize: 12,
          fontFamily: fonts.regular,
          color: 'rgba(255,255,255,0.78)',
          lineHeight: 18,
          marginTop: 8,
        },
        heroImage: {
          width: 150,
          height: 175,
          marginRight: -12,
          marginVertical: -10,
          resizeMode: 'contain',
        },

        sectionTitle: {
          fontSize: 16,
          fontFamily: fonts.semibold,
          color: colors.text,
          marginBottom: 12,
        },
        sectionTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        sectionTitleInline: {
          marginBottom: 0,
        },
        searchToggle: {
          width: 34,
          height: 34,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
        },
        searchReveal: {
          marginBottom: 12,
        },
        searchBar: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          height: 48,
          borderRadius: 14,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
        },
        searchInput: {
          flex: 1,
          fontSize: 14,
          fontFamily: fonts.regular,
          color: colors.text,
          paddingVertical: 0,
        },
        categories: {
          flexDirection: 'row',
          gap: 10,
          paddingRight: 8,
        },
        categoryItem: {
          minHeight: 42,
          minWidth: 108,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 6,
          paddingRight: 14,
          borderRadius: 999,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.divider,
        },
        categoryItemSelected: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        categoryIconBadge: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.divider,
          overflow: 'hidden',
        },
        categoryIconBadgeSelected: {
          backgroundColor: '#FFFFFF',
          borderColor: 'rgba(255,255,255,0.72)',
        },
        categoryBadgeImage: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        categoryText: {
          fontSize: 14,
          fontFamily: fonts.semibold,
          color: colors.textSecondary,
        },
        categoryTextSelected: {
          fontFamily: fonts.semibold,
          color: '#FFFFFF',
        },
        emptyTrainers: {
          width: '100%',
          minHeight: 120,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        emptyTrainersText: {
          fontSize: 13,
          fontFamily: fonts.regular,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        // Outer card owns the shadow only. On iOS a view can't both cast a
        // shadow AND clip children to its borderRadius — combining them stops
        // the rounded corners from masking, so the image's square corners poke
        // past the frame ("floating"). Keep `overflow: visible` here and do the
        // rounded clipping on `trainerPressable` instead.
        trainerCard: {
          backgroundColor: 'rgba(255,255,255,0.10)',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.22)',
          minHeight: 244,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 12 },
          elevation: 5,
        },
        // Inner layer clips the image/gradients to the rounded frame.
        trainerPressable: {
          flex: 1,
          minHeight: 244,
          borderRadius: 18,
          overflow: 'hidden',
        },
        trainerCell: {
          flex: 1,
          paddingHorizontal: 5,
          paddingBottom: 12,
        },
        listHeaderInset: {
          paddingHorizontal: 6,
        },
        trainerImage: {
          ...StyleSheet.absoluteFillObject,
          width: '100%',
          height: '100%',
        },
        trainerImageOverlay: {
          ...StyleSheet.absoluteFillObject,
        },
        trainerGlassSheen: {
          ...StyleSheet.absoluteFillObject,
        },
        trainerBottomGlass: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 132,
        },
        trainerRatingBadge: {
          position: 'absolute',
          top: 14,
          left: 14,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.16)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.28)',
        },
        trainerBody: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'stretch',
          paddingHorizontal: 10,
          paddingBottom: 10,
          gap: 9,
        },
        trainerInfoColumn: {
          flex: 1,
          minWidth: 0,
        },
        trainerName: {
          fontSize: 15,
          fontFamily: fonts.semibold,
          color: '#FFFFFF',
          marginBottom: 6,
        },
        trainerRating: {
          fontSize: 12,
          fontFamily: fonts.semibold,
          color: palette.gold['5'],
        },
        workWithButton: {
          width: '100%',
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: 12,
          paddingRight: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.30)',
          overflow: 'hidden',
        },
        workWithGlass: {
          ...StyleSheet.absoluteFillObject,
        },
        workWithText: {
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          fontFamily: fonts.semibold,
          color: '#FFFFFF',
          textAlign: 'center',
        },
        workWithIcon: {
          width: 30,
          height: 30,
          borderRadius: 15,
          marginLeft: 6,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.24)',
        },
      }),
    [colors],
  );
}
