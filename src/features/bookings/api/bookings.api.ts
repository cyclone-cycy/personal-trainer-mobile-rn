import { client } from '@/shared/api/client';
import type { ApiEnvelope } from '@/shared/api/types';
import type { TrainerAvailability } from '@/features/trainers/types/trainer.types';

import type { SessionPlatform } from '../constants/outreach';

export type BookingType = 'session' | 'discovery';

export interface DiscoverySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  displayTimezone: string | null;
  isActive: boolean;
}

export interface UpcomingBooking {
  // `id` is always the booking ID (use for /bookings/{id}/reschedule).
  id: string;
  trainerId: string | null;
  // `sessionId` is the linked session row's ID — present only for paid_session
  // bookings that have actually started. Use for GET /sessions/{id}. Discovery
  // calls and not-yet-started paid sessions have null here.
  sessionId: string | null;
  type: BookingType;
  status: string;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number | null;
  trainerName: string;
  trainerAvatar: string | null;
  platform: string | null;
  createdAt: string | null;
}

interface BookingListParams {
  timezone?: string;
  type?: BookingType;
  page?: number;
  limit?: number;
}

type UnknownRecord = Record<string, unknown>;

export async function fetchDiscoverySlots(timezone = getTimezone()): Promise<DiscoverySlot[]> {
  const response = await client.get<ApiEnvelope<unknown>>('/discovery-slots', {
    params: { timezone },
  });

  return extractArray(response.data.data).map(mapDiscoverySlot).filter(Boolean) as DiscoverySlot[];
}

export interface CreateSessionBookingRequest {
  trainer_id: string;
  scheduled_start: string;
  scheduled_end: string;
  session_platform: SessionPlatform;
  timezone: string;
  /** Required for `messenger`. */
  messenger_handle?: string;
  /** Required for `whatsapp`/`imessage` (E.164) — "required when session_platform is whatsapp or imessage". */
  phone_number?: string;
}

export interface CreatedSessionBooking {
  id: string;
  clientId: string | null;
  trainerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string | null;
  sessionPlatform: string;
  bookingStatus: string;
  zoomMeetingLink: string | null;
  zoomMeetingId: string | null;
  cancellationReason: string | null;
  createdAt: string | null;
}

export async function createSessionBooking(
  payload: CreateSessionBookingRequest,
): Promise<CreatedSessionBooking> {
  const response = await client.post<ApiEnvelope<unknown>>('/bookings', payload);
  const data = isRecord(response.data.data) ? response.data.data : {};

  return {
    id: pickString(data, ['id', 'booking_id']) ?? '',
    clientId: pickString(data, ['client_id']),
    trainerId: pickString(data, ['trainer_id']) ?? payload.trainer_id,
    scheduledStart: pickString(data, ['scheduled_start']) ?? payload.scheduled_start,
    scheduledEnd: pickString(data, ['scheduled_end']) ?? payload.scheduled_end,
    timezone: pickString(data, ['timezone']),
    sessionPlatform: pickString(data, ['session_platform']) ?? payload.session_platform,
    bookingStatus: pickString(data, ['booking_status', 'status']) ?? 'pending',
    zoomMeetingLink: pickString(data, ['zoom_meeting_link']),
    zoomMeetingId: pickString(data, ['zoom_meeting_id']),
    cancellationReason: pickString(data, ['cancellation_reason']),
    createdAt: pickString(data, ['created_at']),
  };
}

export type RescheduleReason =
  | 'something_came_up'
  | 'feeling_unwell'
  | 'work_conflict'
  | 'personal_emergency'
  | 'travel'
  | 'other';

export interface RescheduleBookingRequest {
  new_datetime: string;
  timezone: string;
  reason: RescheduleReason;
  notes?: string;
  phone_number?: string;
}

export async function rescheduleBooking(
  id: string,
  payload: RescheduleBookingRequest,
): Promise<void> {
  await client.put<ApiEnvelope<unknown>>(`/bookings/${id}/reschedule`, payload);
}

export async function fetchUpcomingBookings({
  timezone = getTimezone(),
  type,
  page = 1,
  limit = 10,
}: BookingListParams = {}): Promise<UpcomingBooking[]> {
  const response = await client.get<ApiEnvelope<unknown>>('/bookings/upcoming', {
    params: { timezone, type, page, limit },
  });

  const raw = extractArray(response.data.data);
  return raw.map(mapUpcomingBooking).filter(Boolean) as UpcomingBooking[];
}

function mapDiscoverySlot(raw: unknown): DiscoverySlot | null {
  if (!isRecord(raw)) return null;

  const dayValue = raw.day_of_week ?? raw.dayOfWeek;
  const dayOfWeek =
    typeof dayValue === 'number'
      ? normalizeWeekday(dayValue)
      : typeof dayValue === 'string'
        ? normalizeWeekday(Number(dayValue))
        : null;
  if (dayOfWeek === null) return null;

  const startTime = pickString(raw, ['start_time', 'startTime']);
  const endTime = pickString(raw, ['end_time', 'endTime']);
  if (!startTime || !endTime) return null;

  const isActive = raw.is_active;

  return {
    id: pickString(raw, ['id', 'slot_id']) ?? `${dayOfWeek}-${startTime}`,
    dayOfWeek,
    startTime,
    endTime,
    timezone: pickString(raw, ['timezone', 'time_zone']) ?? 'UTC',
    displayTimezone: pickString(raw, ['display_timezone', 'displayTimezone']),
    isActive: typeof isActive === 'boolean' ? isActive : true,
  };
}

// Accepts JS (0-6) and ISO (1-7 → maps 7→0). Returns null for anything else.
function normalizeWeekday(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  if (value >= 0 && value <= 6) return value;
  if (value === 7) return 0;
  return null;
}

function mapUpcomingBooking(raw: unknown): UpcomingBooking | null {
  if (!isRecord(raw)) return null;

  const startsAt = pickString(raw, [
    'scheduled_at_local',
    'starts_at',
    'start_at',
    'start_time',
    'selected_datetime',
    'scheduled_at',
    'actual_start',
  ]);
  if (!startsAt) return null;

  const trainer = isRecord(raw.trainer) ? raw.trainer : null;
  const trainerUser = trainer && isRecord(trainer.user) ? trainer.user : null;

  return {
    id: pickString(raw, ['id', 'booking_id']) ?? startsAt,
    trainerId:
      pickString(raw, ['trainer_id', 'trainerId']) ??
      (trainer ? pickString(trainer, ['id', 'trainer_id', 'trainerId']) : null),
    sessionId: pickString(raw, ['session_id', 'sessionId']),
    type: normalizeUpcomingBookingType(pickString(raw, ['type', 'booking_type'])),
    status: pickString(raw, ['status']) ?? 'upcoming',
    startsAt,
    endsAt: pickString(raw, ['ends_at', 'end_at', 'end_time', 'actual_end']) ?? null,
    durationMinutes: pickNumber(raw, ['duration_minutes', 'durationMinutes', 'duration']),
    trainerName:
      pickString(raw, ['trainer_name', 'trainerName']) ??
      (trainer ? pickString(trainer, ['name', 'display_name', 'full_name']) : null) ??
      (trainerUser ? pickString(trainerUser, ['name', 'display_name', 'full_name']) : null) ??
      'FitCall Rep',
    trainerAvatar: normalizeBookingMediaUrl(
      pickString(raw, [
        'trainer_avatar',
        'trainerAvatar',
        'trainer_display_picture',
        'display_picture',
        'avatar_url',
      ]) ??
        (trainer
          ? pickString(trainer, [
              'display_picture',
              'displayPicture',
              'avatar_url',
              'avatarUrl',
              'profile_picture',
              'profilePicture',
            ])
          : null) ??
        (trainerUser
          ? pickString(trainerUser, [
              'avatar_url',
              'avatarUrl',
              'display_picture',
              'displayPicture',
              'profile_picture',
              'profilePicture',
            ])
          : null),
    ),
    platform: pickString(raw, ['platform', 'contact_mode']) ?? null,
    createdAt: pickString(raw, ['created_at', 'createdAt']),
  };
}

function normalizeBookingMediaUrl(value: string | null) {
  if (!value) return null;
  if (value.startsWith('http://localhost:9000')) {
    return value.replace('http://localhost:9000', 'https://api.staging.fitcall.me');
  }
  if (value.startsWith('http://api.staging.fitcall.me')) {
    return value.replace('http://api.staging.fitcall.me', 'https://api.staging.fitcall.me');
  }
  return value;
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];

  for (const key of ['items', 'bookings', 'slots', 'data', 'results']) {
    const value = data[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function pickString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

function pickNumber(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function normalizeUpcomingBookingType(value: string | null): BookingType {
  if (value === 'discovery' || value === 'discovery_call') return 'discovery';
  return 'session';
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

export function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getTrainerAvailabilityDates(
  availability: TrainerAvailability[],
  upcomingBookings: UpcomingBooking[],
  weeksAhead = 4,
) {
  return expandWeeklyAvailabilityToDates(
    availability,
    collectBookedTimes(upcomingBookings, 'session'),
    weeksAhead,
  );
}

export function getDiscoverySlotDates(
  slots: DiscoverySlot[],
  upcomingBookings: UpcomingBooking[],
  weeksAhead = 4,
) {
  return expandWeeklyAvailabilityToDates(
    slots.filter((slot) => slot.isActive),
    collectBookedTimes(upcomingBookings, 'discovery'),
    weeksAhead,
  );
}

function collectBookedTimes(upcomingBookings: UpcomingBooking[], type: BookingType) {
  return new Set(
    upcomingBookings
      .filter((booking) => booking.type === type)
      .map((booking) => new Date(booking.startsAt).getTime())
      .filter((time) => Number.isFinite(time)),
  );
}

interface WeeklyAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

// Expands recurring weekly availability records (in their own timezone) into
// concrete future UTC instants. Shared between trainer availability and
// public discovery slots — both have the same {day_of_week, start_time,
// end_time, timezone} shape.
function expandWeeklyAvailabilityToDates(
  availability: WeeklyAvailability[],
  bookedTimes: Set<number>,
  weeksAhead: number,
): Date[] {
  const now = new Date();
  const slots: Date[] = [];

  for (const item of availability) {
    const tz = item.timezone || 'UTC';
    const today = getZonedDateParts(now, tz);
    if (today === null) continue;

    const [startHour, startMinute] = parseHourMinute(item.startTime);
    const [endHour, endMinute] = parseHourMinute(item.endTime);
    const startMinutesOfDay = startHour * 60 + startMinute;
    const endMinutesOfDay = endHour * 60 + endMinute;
    if (endMinutesOfDay <= startMinutesOfDay) continue;

    const daysUntilTargetDow = (item.dayOfWeek - today.weekday + 7) % 7;

    for (let week = 0; week < weeksAhead; week += 1) {
      const target = addDaysToDateParts(today, daysUntilTargetDow + week * 7);

      for (let m = startMinutesOfDay; m < endMinutesOfDay; m += 60) {
        const hour = Math.floor(m / 60);
        const minute = m % 60;
        const utcMs = zonedTimeToUtc(target.year, target.month, target.day, hour, minute, tz);
        if (!Number.isFinite(utcMs)) continue;
        if (utcMs > now.getTime() && !bookedTimes.has(utcMs)) {
          slots.push(new Date(utcMs));
        }
      }
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}

function parseHourMinute(time: string): [number, number] {
  const [rawHour = '0', rawMinute = '0'] = time.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  return [Number.isFinite(hour) ? hour : 0, Number.isFinite(minute) ? minute : 0];
}

interface ZonedDateParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0-6 with Sunday=0
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

// Returns the year/month/day/weekday as observed in `timezone` at `instant`.
function getZonedDateParts(instant: Date, timezone: string): ZonedDateParts | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long',
    });
    const parts: Record<string, string> = {};
    for (const p of fmt.formatToParts(instant)) {
      if (p.type !== 'literal') parts[p.type] = p.value;
    }
    const weekday = WEEKDAY_INDEX[parts.weekday];
    if (weekday === undefined) return null;
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      weekday,
    };
  } catch {
    return null;
  }
}

function addDaysToDateParts(parts: ZonedDateParts, daysToAdd: number): ZonedDateParts {
  const ms = Date.UTC(parts.year, parts.month - 1, parts.day) + daysToAdd * 86_400_000;
  const dt = new Date(ms);
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    weekday: dt.getUTCDay(),
  };
}

// Returns the UTC ms for the wall-clock instant `year-month-day hour:minute` in `timezone`.
// Works by guessing the input as UTC, then correcting using the timezone's offset at that moment.
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string,
): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = getTimezoneOffsetMs(timezone, new Date(guess));
  if (!Number.isFinite(offset)) return NaN;
  return guess - offset;
}

function getTimezoneOffsetMs(timezone: string, instant: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts: Record<string, string> = {};
    for (const p of fmt.formatToParts(instant)) {
      if (p.type !== 'literal') parts[p.type] = p.value;
    }
    const hour = parts.hour === '24' ? 0 : Number(parts.hour);
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      hour,
      Number(parts.minute),
      Number(parts.second),
    );
    return asUtc - instant.getTime();
  } catch {
    return NaN;
  }
}
