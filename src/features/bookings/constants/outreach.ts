import type { Ionicons } from '@expo/vector-icons';

// Outreach methods. `id` is the value sent as `contact_mode` on the discovery
// endpoint (POST /bookings/discovery). Paid session bookings (POST /bookings)
// use a DIFFERENT `session_platform` vocabulary — zoom, google_meet, messenger,
// imessage, whatsapp — so each option carries an optional `sessionPlatform`
// mapping; options without it can't be used for paid sessions. The two enums
// don't fully overlap (e.g. phone_callback is discovery-only; whatsapp is
// session-only — see `sessionOnly`). Single source of truth for both flows.
//
//   zoom_meeting   — backend creates a Zoom link.            (session: zoom)
//   google_meet    — backend creates a Google Meet room.     (session: google_meet)
//   messenger      — Facebook Messenger (requires handle).    (session: messenger)
//   whatsapp       — WhatsApp message; reuses the phone number (no separate
//                    field). Trainer follows up on that number. (session: whatsapp)
//   phone_callback — trainer calls the phone number provided. (discovery only)
//   imessage       — iMessage from the trainer.               (discovery only)
//
// WhatsApp: added to the POST /bookings `session_platform` CHECK constraint in
// migration 000067, so it's a valid PAID session platform. Like messenger/
// imessage the backend mints no meeting URL — it requires `phone_number` (the
// client's WhatsApp number, E.164) and the trainer starts the chat off-platform.
// It is NOT in the discovery `contact_mode` enum, so it's session-only (see
// `sessionOnly` and DISCOVERY_OUTREACH_OPTIONS).
export type OutreachMethod =
  | 'zoom_meeting'
  | 'phone_callback'
  | 'google_meet'
  | 'messenger'
  | 'whatsapp'
  | 'imessage';

/** Value accepted by POST /bookings `session_platform`. */
export type SessionPlatform = 'zoom' | 'google_meet' | 'messenger' | 'whatsapp' | 'imessage';

/** Extra field the backend requires for a given method, if any. */
export type OutreachField = 'phone' | 'messenger' | null;

export interface OutreachOption {
  id: OutreachMethod;
  /** Short title shown on the selection card and summary. */
  name: string;
  /** One-line explanation shown under the title. */
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** When true, render the bundled Zoom logo instead of `icon`. */
  usesZoomLogo?: boolean;
  /** Which extra input this method needs collected. */
  requires: OutreachField;
  /** POST /bookings value; absent means this method can't book a paid session. */
  sessionPlatform?: SessionPlatform;
  /** True when the method is only valid for paid sessions, not discovery calls
   * (its `id` isn't in the discovery `contact_mode` enum). e.g. whatsapp. */
  sessionOnly?: boolean;
}

export const OUTREACH_OPTIONS: OutreachOption[] = [
  // {
  //   id: 'zoom_meeting',
  //   name: 'Zoom Meeting',
  //   description: "We'll send a Zoom link before your session.",
  //   icon: 'videocam-outline',
  //   usesZoomLogo: true,
  //   requires: null,
  //   sessionPlatform: 'zoom',
  // },
  {
    id: 'google_meet',
    name: 'Google Meet',
    description: "We'll send a Google Meet link before your session.",
    icon: 'videocam-outline',
    requires: null,
    sessionPlatform: 'google_meet',
  },
  {
    id: 'phone_callback',
    name: 'Phone Call',
    description: 'Your trainer calls the number you provide.',
    icon: 'call-outline',
    requires: 'phone',
  },
  {
    id: 'imessage',
    name: 'iMessage',
    description: 'Your trainer messages you on iMessage.',
    icon: 'chatbubble-ellipses-outline',
    requires: 'phone',
    sessionPlatform: 'imessage',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    // Reuses the phone number collected for phone-based options — no separate
    // WhatsApp-number field. Session-only: not in the discovery contact_mode enum.
    description: 'Your trainer messages you on WhatsApp.',
    icon: 'logo-whatsapp',
    requires: 'phone',
    sessionPlatform: 'whatsapp',
    sessionOnly: true,
  },
  {
    id: 'messenger',
    name: 'Messenger',
    description: 'Your trainer reaches out on Facebook Messenger.',
    icon: 'logo-facebook',
    requires: 'messenger',
    sessionPlatform: 'messenger',
  },
];

/** Options valid for paid session bookings (POST /bookings). */
export const SESSION_OUTREACH_OPTIONS: OutreachOption[] = OUTREACH_OPTIONS.filter(
  (o) => o.sessionPlatform,
);

/**
 * Options valid for discovery calls (POST /bookings/discovery). Excludes
 * `sessionOnly` methods (e.g. whatsapp) whose `id` isn't an accepted
 * discovery `contact_mode`.
 */
export const DISCOVERY_OUTREACH_OPTIONS: OutreachOption[] = OUTREACH_OPTIONS.filter(
  (o) => !o.sessionOnly,
);

export function outreachOption(id: OutreachMethod): OutreachOption | undefined {
  return OUTREACH_OPTIONS.find((o) => o.id === id);
}

export function outreachLabel(id: OutreachMethod): string {
  return outreachOption(id)?.name ?? id;
}

export function outreachRequires(id: OutreachMethod): OutreachField {
  return outreachOption(id)?.requires ?? null;
}

/** The POST /bookings `session_platform` value for a method, if bookable. */
export function sessionPlatformFor(id: OutreachMethod): SessionPlatform | undefined {
  return outreachOption(id)?.sessionPlatform;
}
