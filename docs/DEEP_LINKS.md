# Deep links — reschedule (and future `/session/*`)

Universal Links (iOS) + App Links (Android) on **`fitcall.me`** so a link in an
email opens the app if installed, or the website otherwise.

## The link for the backend to email

```
https://fitcall.me/session/{booking_id}/reschedule
```

- `{booking_id}` is the booking/session id — the same value `GET /sessions/{id}`
  accepts and the reschedule screen expects.
- Tapping it opens the app at the **Reschedule** screen for that booking. If the
  app isn't installed, it opens `https://fitcall.me/session/{id}/reschedule` in a
  browser (host a sensible web page / redirect there).
- In-app / QA fallback (no hosting needed): `fitcall://session/{booking_id}/reschedule`.

The app claims only `fitcall.me/session/*` — all other `fitcall.me` URLs keep
opening in the browser.

## What the app already does (this PR)

- `app.json`: `ios.associatedDomains: ["applinks:fitcall.me"]` and an Android
  `intentFilters` entry (`autoVerify`, `https`, host `fitcall.me`, pathPrefix
  `/session`).
- Routing: expo-router maps `/session/{id}/reschedule` to the Reschedule screen,
  which fetches the booking by id from `GET /sessions/{id}`.
- Auth survival: a deep link opened while logged out is stashed and replayed
  after login.

> ⚠️ Native config — requires `expo prebuild` + a fresh app build (AAB/IPA).
> It does **not** take effect via JS/OTA reload.

## What the backend/devops team must host on `fitcall.me`

Both files must be served over HTTPS, publicly, with **no redirects**.

### 1. `https://fitcall.me/.well-known/apple-app-site-association`

- **No** file extension. `Content-Type: application/json`.
- Generate it (keeps the Apple Team ID out of source):
  ```
  APPLE_TEAM_ID=XXXXXXXXXX pnpm applinks:generate
  # → well-known/apple-app-site-association
  ```
  Contents (Team ID from the env var, bundle id `net.emerj.fitcall`):
  ```json
  {
    "applinks": {
      "apps": [],
      "details": [{ "appID": "<APPLE_TEAM_ID>.net.emerj.fitcall", "paths": ["/session/*"] }]
    }
  }
  ```

### 2. `https://fitcall.me/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "net.emerj.fitcall",
      "sha256_cert_fingerprints": [
        "B6:0F:F4:69:14:60:A4:00:71:41:A3:34:09:C7:00:57:C6:A5:80:3D:6C:AE:31:15:AF:19:85:B5:CB:80:C9:F2"
      ]
    }
  }
]
```

The fingerprint above is the **local release keystore** (`fitcall-release.keystore`,
alias `fitcall`). If the app ships via Play Store with **Play App Signing**,
Google re-signs it — you **must also add** Google's app-signing SHA-256 (Play
Console → Setup → App integrity) to the array, or App Links won't verify on
Play-installed apps:

```
ANDROID_EXTRA_SHA256=<PLAY_APP_SIGNING_SHA256> APPLE_TEAM_ID=XXXXXXXXXX pnpm applinks:generate
```

## Verifying after deploy

- iOS: `https://app-site-association.cdn-apple.com/a/v1/fitcall.me` should show the AASA; reinstall the app to re-fetch.
- Android: `adb shell pm verify-app-links --re-verify net.emerj.fitcall` then
  `adb shell pm get-app-links net.emerj.fitcall` should show `fitcall.me: verified`.
