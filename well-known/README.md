# `.well-known` association files

Static association files for deep links (Universal Links / App Links) on
**fitcall.me**. See [`../docs/DEEP_LINKS.md`](../docs/DEEP_LINKS.md) for the full
setup.

**These are not served by the mobile app.** Host them on the fitcall.me web app
(Next.js) so they resolve at:

- `https://fitcall.me/.well-known/apple-app-site-association`
- `https://fitcall.me/.well-known/assetlinks.json`

Copy both into the Next.js app's `public/.well-known/` (and give the
extension-less AASA a `Content-Type: application/json` header — see the docs).

## Editing

- **`apple-app-site-association`** — `appID` is `<AppleTeamID>.net.emerj.fitcall`.
- **`assetlinks.json`** — `sha256_cert_fingerprints` currently holds the local
  release keystore (`fitcall-release.keystore`) fingerprint. If the app ships via
  Play Store with **Play App Signing**, add Google's app-signing SHA-256 (Play
  Console → Setup → App integrity) as another entry in that array, or Android
  App Links won't verify on Play installs.
