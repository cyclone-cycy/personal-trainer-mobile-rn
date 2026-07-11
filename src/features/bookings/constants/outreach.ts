import type { Ionicons } from '@expo/vector-icons';

// Outreach methods. `id` is the value sent as `contact_mode` on the discovery
// endpoint (POST /bookings/discovery). Paid session bookings (POST /bookings)
// use a DIFFERENT, smaller vocabulary for `session_platform` — only zoom,
// google_meet and messenger — so each option carries an optional
// `sessionPlatform` mapping; options without it can't be used for paid sessions.
// Single source of truth so both flows stay in sync.
//
//   zoom_meeting   — backend creates a Zoom link.            (session: zoom)
//   google_meet    — backend creates a Google Meet room.     (session: google_meet)
//   messenger      — Facebook Messenger (requires handle).    (session: messenger)
//   phone_callback — trainer calls the phone number provided. (discovery only)
//   imessage       — iMessage from the trainer.               (discovery only)
export type OutreachMethod =
  | 'zoom_meeting'
  | 'phone_callback'
  | 'google_meet'
  | 'messenger'
  | 'imessage';

/** Value accepted by POST /bookings `session_platform`. */
export type SessionPlatform = 'zoom' | 'google_meet' | 'messenger' | 'imessage';

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
