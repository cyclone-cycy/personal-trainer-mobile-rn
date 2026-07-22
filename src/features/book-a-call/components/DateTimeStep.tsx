import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, LogoRefreshScrollView, toast, Typography } from '@/shared/components';
import { palette, useTheme } from '@/shared/theme';
import { buildLocalDateTimeIso, formatDisplayTime } from '@/shared/utils/dateTime';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
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

const TIME_SLOTS = [
  '7:00 AM',
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
];
const UNAVAILABLE_TIMES = new Set(['7:00 AM', '1:00 PM', '6:00 PM']);

const CIRCLE_SIZE = 36;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const DASH_COUNT = 10;
const DASH_WIDTH = 5;
const DASH_HEIGHT = 1.5;

function DashedCircle({
  color,
  style,
  children,
}: {
  color: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  return (
    <View style={[{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }, style]}>
      {Array.from({ length: DASH_COUNT }, (_, i) => {
        const angle = (i * 360) / DASH_COUNT;
        const rad = ((angle - 90) * Math.PI) / 180;
        const x = CIRCLE_RADIUS + (CIRCLE_RADIUS - 2) * Math.cos(rad) - DASH_WIDTH / 2;
        const y = CIRCLE_RADIUS + (CIRCLE_RADIUS - 2) * Math.sin(rad) - DASH_HEIGHT / 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: DASH_WIDTH,
              height: DASH_HEIGHT,
              backgroundColor: color,
              left: x,
              top: y,
              borderRadius: 1,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
      {children}
    </View>
  );
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Scroll wrapper hoisted to module scope so it keeps a STABLE component identity
// across DateTimeStep re-renders. Previously this was defined inline in render,
// so every keystroke/date tap created a new component type and React remounted
// the whole calendar/time subtree — replaying the entrance animations and making
// date→time selection flicker. When the parent wires up onRefresh we use the
// spinning-logo pull-to-refresh (matching the rest of the app); otherwise a
// plain ScrollView.
function DateTimeScroll({
  onRefresh,
  isRefreshing,
  paddingHorizontal,
  children,
}: {
  onRefresh?: () => void | Promise<unknown>;
  isRefreshing?: boolean;
  paddingHorizontal: number;
  children: React.ReactNode;
}) {
  const contentContainerStyle = [styles.content, { paddingHorizontal }];
  if (onRefresh) {
    return (
      <LogoRefreshScrollView
        refreshing={!!isRefreshing}
        onRefresh={() => onRefresh()}
        style={styles.scroll}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </LogoRefreshScrollView>
    );
  }
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

interface DateTimeStepProps {
  draft: {
    date: Date | null;
    time: string | null;
  };
  onUpdate: (patch: { date?: Date | null; time?: string | null }) => void;
  onContinue: () => void;
  availableSlots?: Date[];
  isLoadingSlots?: boolean;
  useRemoteSlots?: boolean;
  onRefresh?: () => void | Promise<unknown>;
  isRefreshing?: boolean;
  glass?: boolean;
}

export function DateTimeStep({
  draft,
  onUpdate,
  onContinue,
  availableSlots = [],
  isLoadingSlots = false,
  useRemoteSlots = false,
  onRefresh,
  isRefreshing = false,
  glass = false,
}: DateTimeStepProps) {
  const { colors, spacing, isDark } = useTheme();
  const glassSurface = isDark ? 'rgba(0,0,0,0.48)' : 'rgba(255,255,255,0.78)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.58)';
  const glassReadableText = glass ? '#FFFFFF' : colors.text;
  const glassMutedText = glass ? 'rgba(255,255,255,0.70)' : colors.textSecondary;
  const glassTimeBorder = glass ? 'rgba(255,255,255,0.82)' : colors.border;
  const glassUnavailableText = glass ? 'rgba(255,255,255,0.46)' : colors.textSecondary;
  const today = new Date();
  const todayMidnight = startOfDay(today);
  const futureAvailableSlots = useMemo(() => {
    const now = Date.now();
    return availableSlots.filter((slot) => slot.getTime() > now);
  }, [availableSlots]);

  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const calendarCells = useMemo(() => getMonthCalendarCells(viewMonth), [viewMonth]);

  const timezoneLabel = useMemo(() => {
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const hours = String(Math.floor(abs / 60)).padStart(2, '0');
    const minutes = String(abs % 60).padStart(2, '0');
    return `GMT${sign}${hours}:${minutes}`;
  }, []);

  // Header label — show both months if the week straddles a boundary
  const headerLabel = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  function prevMonth() {
    setViewMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }

  function nextMonth() {
    setViewMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }

  function onDayPress(date: Date) {
    if (date < todayMidnight) {
      toast.info('You cannot select a date in the past.');
      return;
    }
    // In legacy (non-remote) mode, weekends are unavailable by default.
    // With remote availability the data decides — including weekend slots.
    if (!useRemoteSlots && (date.getDay() === 0 || date.getDay() === 6)) return;
    if (useRemoteSlots && !hasAvailableSlotForDay(date)) return;
    onUpdate({ date, time: null });
  }

  function onTimePress(slot: string) {
    if (isTimeUnavailable(slot)) return;
    onUpdate({ time: slot });
  }

  const availableTimesForSelectedDay = useRemoteSlots
    ? getAvailableTimesForDay(draft.date)
    : TIME_SLOTS;
  const isValid = draft.date !== null && draft.time !== null;

  return (
    <View style={styles.container}>
      <DateTimeScroll
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        paddingHorizontal={spacing.md}
      >
        <Animated.View entering={FadeInDown.duration(360)}>
          <Typography variant="h2" color={glass ? '#FFFFFF' : undefined} style={styles.heading}>
            Pick a date and time
          </Typography>
          <Typography
            variant="body2"
            color={glass ? 'rgba(255,255,255,0.74)' : colors.textSecondary}
            style={styles.subtitle}
          >
            {isLoadingSlots ? 'Loading available slots...' : 'Only available slots are shown.'}
          </Typography>
        </Animated.View>

        {/* Calendar card */}
        <Animated.View
          entering={FadeInUp.delay(80).duration(360)}
          style={[
            styles.calendarCard,
            {
              backgroundColor: glass ? glassSurface : colors.surface,
              borderColor: glass ? glassBorder : colors.border,
            },
          ]}
        >
          {/* Month header */}
          <View style={styles.monthHeader}>
            <Pressable onPress={prevMonth} hitSlop={12} style={styles.chevronBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <View style={styles.monthTitleRow}>
              <Typography variant="body1" style={styles.monthTitle}>
                {headerLabel}
              </Typography>
              <Ionicons
                name="chevron-down"
                size={14}
                color={colors.text}
                style={styles.dropChevron}
              />
            </View>
            <Pressable onPress={nextMonth} hitSlop={12} style={styles.chevronBtn}>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Day-of-week labels */}
          <View style={styles.dowRow}>
            {DAY_LABELS.map((d) => (
              <Typography
                key={d}
                variant="body2"
                color={colors.textSecondary}
                style={styles.dowLabel}
              >
                {d}
              </Typography>
            ))}
          </View>

          {/* Full month grid */}
          <View style={styles.monthGrid}>
            {calendarCells.map((date, i) => {
              if (!date) {
                return <View key={`empty-${i}`} style={styles.dayCell} />;
              }

              const isToday = isSameDay(date, today);
              const isPast = date < todayMidnight;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const blockWeekend = !useRemoteSlots && isWeekend;
              const avail =
                !blockWeekend && !isPast && (!useRemoteSlots || hasAvailableSlotForDay(date));
              const selected = draft.date ? isSameDay(date, draft.date) : false;

              return (
                <Pressable
                  key={i}
                  onPress={() => onDayPress(date)}
                  style={[styles.dayCell, !avail && { opacity: 0.3 }]}
                >
                  {isToday && !selected ? (
                    <DashedCircle color={colors.textSecondary}>
                      <Typography
                        variant="body2"
                        color={colors.text}
                        style={[styles.dayText, styles.dayTextAbsolute]}
                      >
                        {date.getDate()}
                      </Typography>
                    </DashedCircle>
                  ) : (
                    <View
                      style={[styles.dayCircle, selected && { backgroundColor: colors.primary }]}
                    >
                      <Typography
                        variant="body2"
                        color={selected ? '#fff' : colors.text}
                        style={styles.dayText}
                      >
                        {date.getDate()}
                      </Typography>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Legend */}
        <Animated.View entering={FadeInUp.delay(160).duration(360)} style={styles.legend}>
          {[
            { color: palette.neutral['3'], fill: true, label: 'Unavailable' },
            { color: colors.border, fill: false, label: 'Available' },
            { color: colors.primary, fill: true, label: 'Selected' },
          ].map(({ color, fill, label }) => (
            <View key={label} style={styles.legendItem}>
              <View
                style={[
                  styles.legendCircle,
                  fill
                    ? { backgroundColor: color }
                    : { borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent' },
                ]}
              />
              <Typography variant="body2" color={colors.textSecondary} style={styles.legendLabel}>
                {label}
              </Typography>
            </View>
          ))}
        </Animated.View>

        {/* Time slots header */}
        <Animated.View entering={FadeInUp.delay(220).duration(360)} style={styles.timezoneRow}>
          <Ionicons
            name="globe-outline"
            size={15}
            color={glassMutedText}
            style={styles.globeIcon}
          />
          <Typography variant="body2" color={glassMutedText}>
            Available Times in your timezone ({timezoneLabel})
          </Typography>
        </Animated.View>

        {/* Time grid */}
        <Animated.View entering={FadeInUp.delay(280).duration(360)} style={styles.timeGrid}>
          {useRemoteSlots && !isLoadingSlots && futureAvailableSlots.length === 0 ? (
            <View style={styles.noSlots}>
              <Typography variant="body2" color={colors.textSecondary} style={styles.noSlotsText}>
                No available time slots.
              </Typography>
            </View>
          ) : useRemoteSlots && !draft.date ? (
            <View style={styles.noSlots}>
              <Typography variant="body2" color={colors.textSecondary} style={styles.noSlotsText}>
                Select a date to see available times.
              </Typography>
            </View>
          ) : useRemoteSlots && availableTimesForSelectedDay.length === 0 ? (
            <View style={styles.noSlots}>
              <Typography variant="body2" color={colors.textSecondary} style={styles.noSlotsText}>
                No times available on this day.
              </Typography>
            </View>
          ) : (
            availableTimesForSelectedDay.map((slot) => {
              const unavail = isTimeUnavailable(slot);
              const selected = draft.time === slot;
              return (
                <Pressable
                  key={slot}
                  onPress={() => onTimePress(slot)}
                  style={[
                    styles.timeSlot,
                    unavail && styles.timeSlotUnavail,
                    !unavail &&
                      !selected && {
                        borderWidth: 1,
                        borderColor: glassTimeBorder,
                        borderRadius: 10,
                      },
                    selected && { backgroundColor: colors.primary, borderRadius: 10 },
                  ]}
                  disabled={unavail}
                >
                  <Typography
                    variant="body2"
                    color={selected ? '#fff' : unavail ? glassUnavailableText : glassReadableText}
                    style={[styles.timeText, selected && { fontWeight: '600' }]}
                  >
                    {selected ? `✓ ${slot}` : slot}
                  </Typography>
                </Pressable>
              );
            })
          )}
        </Animated.View>

        <View style={styles.footerSpacer} />
      </DateTimeScroll>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.lg,
            backgroundColor: glass ? 'transparent' : colors.background,
          },
        ]}
      >
        <Button
          label="Continue"
          disabled={!isValid}
          onPress={onContinue}
          style={glass && styles.glassButton}
        />
      </View>
    </View>
  );

  function hasAvailableSlotForDay(date: Date) {
    return futureAvailableSlots.some((slot) => isSameDay(slot, date));
  }

  function hasAvailableSlotForTime(date: Date, time: string) {
    return futureAvailableSlots.some(
      (slot) => isSameDay(slot, date) && formatSlotTime(slot) === time,
    );
  }

  function isTimeUnavailable(slot: string) {
    if (useRemoteSlots) {
      return !draft.date || !hasAvailableSlotForTime(draft.date, slot);
    }
    return UNAVAILABLE_TIMES.has(slot) || isPastTimeForSelectedDay(slot);
  }

  function getAvailableTimesForDay(date: Date | null) {
    if (!date) return [];

    return Array.from(
      new Set(futureAvailableSlots.filter((slot) => isSameDay(slot, date)).map(formatSlotTime)),
    );
  }

  function isPastTimeForSelectedDay(slot: string) {
    if (!draft.date) return false;
    return buildDateFromSlot(draft.date, slot).getTime() <= Date.now();
  }
}

function buildDateFromSlot(date: Date, time: string): Date {
  return new Date(buildLocalDateTimeIso(date, time));
}

function formatSlotTime(date: Date) {
  return formatDisplayTime(date);
}

function getMonthCalendarCells(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const leadingEmpty = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: 8, paddingBottom: 16 },
  heading: { fontWeight: '700', marginBottom: 6 },
  subtitle: { marginBottom: 20 },
  calendarCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chevronBtn: { padding: 4 },
  monthTitleRow: { flexDirection: 'row', alignItems: 'center' },
  monthTitle: { fontWeight: '600' },
  dropChevron: { marginLeft: 4 },
  dowRow: { flexDirection: 'row', marginBottom: 8 },
  dowLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayText: { fontSize: 13, fontWeight: '500' },
  dayTextAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    textAlign: 'center',
    lineHeight: CIRCLE_SIZE,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendCircle: { width: 16, height: 16, borderRadius: 8, marginRight: 6 },
  legendLabel: { fontSize: 12 },
  timezoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  globeIcon: { marginRight: 6 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: {
    width: '30%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotUnavail: { opacity: 0.4 },
  timeText: { fontSize: 13 },
  noSlots: {
    width: '100%',
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  noSlotsText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  footerSpacer: { height: 8 },
  footer: { paddingTop: 12 },
  glassButton: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
});
