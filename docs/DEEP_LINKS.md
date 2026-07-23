# Deep links — reschedule (and future `/session/*`)

Universal Links (iOS) + App Links (Android) on **`fitcall.me`** so a link in an
email opens the app if installed, or the website otherwise.

## The link for the backend to email

```text
https://fitcall.me/session/{booking_id}/reschedule
```

- `{booking_id}` is the booking/session id — the same value `GET /sessions/{id}`
  accepts and the reschedule screen expects.
- Tapping it opens the app at the **Reschedule** screen for that booking. If the
  app isn't installed, it opens the same URL in a browser (the FE app should
  have a page or redirect at `/session/:id/reschedule`).
- In-app / QA fallback (no hosting needed): `fitcall://session/{booking_id}/reschedule`.

The app claims only `fitcall.me/session/*` — all other `fitcall.me` URLs keep
opening in the browser.

## App side — already configured (no scripts)

In `app.json`:

- `ios.associatedDomains: ["applinks:fitcall.me"]`
- Android `intentFilters` entry: `autoVerify`, `https`, host `fitcall.me`,
  `pathPrefix: /session/`.

Routing maps `/session/{id}/reschedule` to the Reschedule screen, which fetches
the booking via `GET /sessions/{id}`. A deep link opened while logged out is
stashed and replayed after login.

> ⚠️ Native config — requires `expo prebuild` + a fresh app build (AAB/IPA).
> It does **not** take effect via a JS/OTA reload.

## Web side — host two static files on `fitcall.me` (Next.js FE app)

The association files are committed under [`../well-known/`](../well-known/).
Copy both into the Next.js app's `public/.well-known/` so they resolve at the
domain root. They are plain static files — nothing to generate or run.

- `https://fitcall.me/.well-known/apple-app-site-association`
- `https://fitcall.me/.well-known/assetlinks.json`

Requirements: HTTPS, publicly reachable, **no redirects**. The AASA has **no
file extension** and must be served as `application/json` — in `next.config.js`:

```js
async headers() {
  return [
    {
      source: '/.well-known/apple-app-site-association',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
    },
  ];
}
```

Also make sure any `middleware.ts` `matcher` and custom `rewrites()` exclude
`/.well-known/` so the files aren't intercepted.

### `apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [{ "appID": "4SBT69NK9W.net.emerj.fitcall", "paths": ["/session/*"] }]
  }
}
```

### `assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "net.emerj.fitcall",
      "sha256_cert_fingerprints": [
        "B6:0F:F4:69:14:60:A4:00:71:41:A3:34:09:C7:00:57:C6:A5:80:3D:6C:AE:31:15:AF:19:85:B5:CB:80:C9:F2",
        "C2:FE:89:28:53:CA:07:58:7F:33:AC:F3:02:6D:B1:9B:41:2E:73:33:A2:46:51:49:F5:95:CD:A5:3D:D6:5D:71"
      ]
    }
  }
]
```

Two fingerprints are listed so App Links verify on both distribution paths:
the first is the **local release keystore** (`fitcall-release.keystore`, alias
`fitcall`) for direct/sideload installs; the second is the **Play App Signing**
certificate (Play Console → Setup → App integrity), used because Google re-signs
Play Store builds with its own key. Add any additional signing certs here.

## Verifying after deploy

```sh
curl -sI https://fitcall.me/.well-known/apple-app-site-association   # 200, application/json, no redirect
curl -s  https://fitcall.me/.well-known/assetlinks.json              # valid JSON
```

- iOS re-fetches the AASA via Apple's CDN
  (`https://app-site-association.cdn-apple.com/a/v1/fitcall.me`); allow cache
  time or reinstall the app.
- Android: `adb shell pm get-app-links net.emerj.fitcall` should show
  `fitcall.me: verified`.
