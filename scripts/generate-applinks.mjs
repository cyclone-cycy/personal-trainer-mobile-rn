// Generates the Universal Links / App Links association files for the deep-link
// domain (fitcall.me), to be hosted by the backend at:
//   https://fitcall.me/.well-known/apple-app-site-association   (iOS)
//   https://fitcall.me/.well-known/assetlinks.json              (Android)
//
// The Apple Team ID is read from the APPLE_TEAM_ID environment variable (never
// hardcoded). Run:  APPLE_TEAM_ID=XXXXXXXXXX node scripts/generate-applinks.mjs
// (or set it in .env — this script loads .env if the var isn't already set).
//
// Output goes to ./well-known/. Hand those two files to the backend/devops team.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const IOS_BUNDLE_ID = 'net.emerj.fitcall';
const ANDROID_PACKAGE = 'net.emerj.fitcall';
// SHA-256 of the local release keystore (fitcall-release.keystore, alias
// fitcall). For Play Store installs with Play App Signing, ALSO add Google's
// app-signing SHA-256 (Play Console → Setup → App integrity) via
// ANDROID_EXTRA_SHA256 (comma-separated) — App Links won't verify otherwise.
const LOCAL_ANDROID_SHA256 =
  'B6:0F:F4:69:14:60:A4:00:71:41:A3:34:09:C7:00:57:C6:A5:80:3D:6C:AE:31:15:AF:19:85:B5:CB:80:C9:F2';

// Paths the app claims. Kept scoped to /session/* so the rest of fitcall.me
// (marketing pages) still opens in the browser. Matches the Android intent
// filter's pathPrefix "/session" in app.json.
const CLAIMED_PATHS = ['/session/*'];

// Load APPLE_TEAM_ID from .env if it isn't already in the environment.
function loadEnvVar(name) {
  if (process.env[name]) return process.env[name].trim();
  const envFile = join(root, '.env');
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*?)\\s*$`));
      if (m) return m[1].trim();
    }
  }
  return '';
}

const appleTeamId = loadEnvVar('APPLE_TEAM_ID');
if (!appleTeamId) {
  console.error(
    'APPLE_TEAM_ID is not set. Set it in the environment or .env, e.g.\n' +
      '  APPLE_TEAM_ID=ABCDE12345 node scripts/generate-applinks.mjs',
  );
  process.exit(1);
}

const extraAndroidSha = (process.env.ANDROID_EXTRA_SHA256 ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const androidFingerprints = [LOCAL_ANDROID_SHA256, ...extraAndroidSha];

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appID: `${appleTeamId}.${IOS_BUNDLE_ID}`,
        paths: CLAIMED_PATHS,
      },
    ],
  },
};

const assetlinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: ANDROID_PACKAGE,
      sha256_cert_fingerprints: androidFingerprints,
    },
  },
];

const outDir = join(root, 'well-known');
mkdirSync(outDir, { recursive: true });
// AASA has NO file extension and must be served as application/json.
writeFileSync(join(outDir, 'apple-app-site-association'), JSON.stringify(aasa, null, 2) + '\n');
writeFileSync(join(outDir, 'assetlinks.json'), JSON.stringify(assetlinks, null, 2) + '\n');

console.log('Wrote well-known/apple-app-site-association and well-known/assetlinks.json');
console.log(`  iOS appID:        ${appleTeamId}.${IOS_BUNDLE_ID}`);
console.log(`  Android package:  ${ANDROID_PACKAGE}`);
console.log(`  Android SHA-256:  ${androidFingerprints.join(', ')}`);
if (!extraAndroidSha.length) {
  console.log(
    '  NOTE: only the local keystore fingerprint is included. For Play Store\n' +
      '  builds add Play App Signing SHA-256 via ANDROID_EXTRA_SHA256.',
  );
}
