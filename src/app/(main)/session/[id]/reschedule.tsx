import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessionDetails } from '@/features/sessions/hooks/useSessionDetails';
import { Button, Screen, Typography } from '@/shared/components';
import { fonts, useTheme } from '@/shared/theme';

const AVAILABLE_TIMES = [
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
];

export default function RescheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Fetch the booking by id from the API rather than a local store, so the
  // screen works when opened cold from a reschedule deep link (email), where
  // no in-memory session list exists yet.
  const { data: session, isLoading, isError } = useSessionDetails(id);
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState<number>(24); // Default to mock Aug 24
  const [selectedTime, setSelectedTime] = useState<string>('10:30 AM');

  if (isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (isError || !session) {
    return (
      <Screen style={styles.centered}>
        <Typography>Session not found</Typography>
      </Screen>
    );
  }

  const handleContinue = () => {
    // In a real app we'd pass the actual Date object
    router.push({
      pathname: `/(main)/session/[id]/confirm-reschedule`,
      params: {
        id: session.id,
        newDate: `2024-08-${selectedDate.toString().padStart(2, '0')}`,
        newTime: selectedTime,
      },
    } as any);
  };

  const renderCalendar = () => {
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const daysInMonth = 31;
    const startDay = 4; // Mock August 1st 2024 is a Thursday (4)

    const grid = [];
    let currentDay = 1;

    for (let row = 0; row < 6; row++) {
      const rowCells = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < startDay) {
          rowCells.push(<View key={`empty-${col}`} style={styles.calendarCell} />);
        } else if (currentDay <= daysInMonth) {
          const day = currentDay;
          const isSelected = selectedDate === day;
          rowCells.push(
            <Pressable
              key={`day-${day}`}
              style={[
                styles.calendarCell,
                isSelected && { backgroundColor: colors.primary, borderRadius: 20 },
              ]}
              onPress={() => setSelectedDate(day)}
            >
              <Typography
                variant="body2"
                color={isSelected ? '#FFFFFF' : colors.text}
                style={{ fontWeight: isSelected ? '600' : '400' }}
              >
                {day}
              </Typography>
            </Pressable>,
          );
          currentDay++;
        } else {
          rowCells.push(<View key={`empty-end-${col}`} style={styles.calendarCell} />);
        }
      }
      grid.push(
        <View key={`row-${row}`} style={styles.calendarRow}>
          {rowCells}
        </View>,
      );
      if (currentDay > daysInMonth) break;
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Typography variant="h3" style={{ fontFamily: fonts.bold }}>
            August 2024
          </Typography>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Ionicons name="chevron-back" size={24} color={colors.icon} />
            <Ionicons name="chevron-forward" size={24} color={colors.icon} />
          </View>
        </View>

        <View style={styles.calendarDaysHeader}>
          {daysOfWeek.map((d, i) => (
            <View key={`dow-${i}`} style={styles.calendarCell}>
              <Typography variant="label" color={colors.textSecondary}>
                {d}
              </Typography>
            </View>
          ))}
        </View>
        {grid}
      </View>
    );
  };

  return (
    <Screen padding={false} edges={['top']} backgroundColor={colors.surface}>
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Typography variant="h3" style={styles.headerTitle}>
          Reschedule Session
        </Typography>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: 100 + insets.bottom,
        }}
      >
        <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 4 }}>
          Step 1 of 2
        </Typography>
        <Typography variant="h3" style={{ marginBottom: spacing.xl }}>
          Pick a new date and time
        </Typography>

        {renderCalendar()}

        <View style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Typography variant="body2" style={{ marginLeft: 8, fontWeight: '500' }}>
              Available times (West Africa Standard Time)
            </Typography>
          </View>

          <View style={styles.timesGrid}>
            {AVAILABLE_TIMES.map((time) => {
              const isSelected = selectedTime === time;
              return (
                <Pressable
                  key={time}
                  style={[
                    styles.timeButton,
                    { borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { backgroundColor: colors.primarySubtle },
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Typography
                    variant="label"
                    color={isSelected ? colors.primary : colors.text}
                    style={{ fontWeight: isSelected ? '600' : '500' }}
                  >
                    {time}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: spacing.md + insets.bottom,
          },
        ]}
      >
        <Button label="Continue to confirm" onPress={handleContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  calendarContainer: {
    marginBottom: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarCell: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeButton: {
    width: '30%', // roughly 3 per row
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bottomBar: {
    borderTopWidth: 1,
  },
});
