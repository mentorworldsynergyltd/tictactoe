# Play Store submission checklist

Everything below is specific to this project as it stands today
(`com.tictactoe.mentorworld`, version `0.3.0`, versionCode `1`). Work through it top
to bottom.

**Package name note**: this was changed from `com.tictactoe.game` because that name
was already taken on the Play Store. If you ever need to change it again, it has to
happen *before* your first Play Store upload — once published, this is the app's
permanent identity and can never change without becoming a new, separate listing.

## 1. Signing key — already generated

A release keystore was generated for you (see the separate `tictactoe-release-keystore`
delivery — **do not lose this file or its password**; losing it means you can never
publish an update to this app listing again, ever).

To wire it up locally:

```bash
cd tictactoe/android
cp keystore.properties.example keystore.properties
# now edit keystore.properties and fill in the real storePassword/keyAlias/keyPassword
# from the credentials that came with the keystore file, and drop the .keystore
# file itself in this android/ directory (or point storeFile at wherever you keep it)
```

`keystore.properties` and `*.keystore` are already gitignored — never commit them.

Build a signed release bundle for the Play Store with:

```bash
cd tictactoe
npm run build:android
cd android
./gradlew bundleRelease
```

The output `.aab` lands at `android/app/build/outputs/bundle/release/app-release.aab` —
**this is the file you upload to Play Console**, not an `.apk`.

## 2. AdMob — real ad unit IDs wired in ✅

Real IDs are in place (App ID `ca-app-pub-5745424554460135~4963511006`, plus the
banner/interstitial/rewarded ad units) in both
`android/app/src/main/res/values/strings.xml` and `src/lib/ads.ts`, and the project's
already been rebuilt and re-synced with them (`npm run build:android` was run after
the swap — confirmed the real IDs made it into both `dist/` and
`android/app/src/main/assets/public/`).

One thing worth doing before submitting: AdMob ad units can take a little while
(sometimes a few hours) after creation before they reliably serve real ads — if you
test a release build immediately and see blank/no ads, that's normal AdMob ramp-up,
not a bug in this wiring. Also double check in the AdMob console that this app's
entry there is linked to the Play Store listing once the listing exists (AdMob will
prompt for this) — unlinked apps can have ad serving limited.

Then re-run `npm run build:android` and rebuild the AAB.

## 3. Privacy policy — using your own hosted URL ✅

The in-app link (`src/lib/links.ts`'s `PRIVACY_POLICY_URL`) now points at
`https://mentorworldgroup.com/privacy-policy-2/` instead of the drafted Claude
artifact.

**Worth double-checking yourself**: Play's reviewers check that the linked policy
actually reflects what the app does, not just that a link exists. Confirm that page
covers — or add to it — the specifics that matter for this app: Google AdMob /
advertising identifier collection (banner, interstitial, and rewarded ads all run
through AdMob), and that LAN games exchange your display name and IP directly
between devices rather than through a server. If your site's policy is a generic
company-wide one that doesn't mention advertising or this app specifically, that's a
plausible reason for a Play Store rejection at review. The originally drafted text
(written to cover exactly these points) is still sitting at
`store-assets/privacy-policy.html` in the project if you want to merge language from
it into your hosted page.

Paste `https://mentorworldgroup.com/privacy-policy-2/` into Play Console under
**App content → Privacy policy**, and also into the store listing's privacy policy
field.

## 4. App icon, feature graphic, screenshots

Generated for you in `store-assets/`:

- `icon-512.png` — the 512×512 Play Store listing icon
- `feature-graphic-1024x500.png` — the store listing's feature graphic

The app's actual launcher icon (all densities) and splash screen were also replaced
in `android/app/src/main/res/` — you'll see the new icon once you rebuild.

**Still needed from you**: at least 2 phone screenshots (Play requires 2–8, JPEG or
24-bit PNG, 16:9 or 9:16, each side between 320px and 3840px). Run the app on a device
or emulator and capture:

1. The home screen (mode picker)
2. An in-progress game board (ideally mid-match, showing marks on the grid)
3. Optionally: the AI difficulty picker, and the LAN host/join screens

## 5. Store listing copy

**App name**: Tic Tac Toe

**Short description** (max 80 characters):
```
Classic Tic-Tac-Toe with a smart AI and local Wi-Fi multiplayer.
```

**Full description** (max 4000 characters) — a starting draft, edit freely:
```
Tic Tac Toe, done properly — play solo against a computer opponent with three
real difficulty levels, pass the phone for local two-player games, or challenge
a friend on the same Wi-Fi network.

FEATURES
• Play vs. Computer — Easy, Medium, and unbeatable Hard difficulty
• Pass & Play — two players, one device
• Local Wi-Fi multiplayer — host or join a game with anyone on your network,
  no internet or account required
• Clean, fast, distraction-light interface with light and dark themes
• Score tracking across rematches

No sign-up. No data collection beyond what's needed to show ads. Just a fast,
well-made game of Tic-Tac-Toe.
```

**Category**: Games → Puzzle (or Board)

**Content rating**: run the Play Console content rating questionnaire. Given this
app has no user-generated content, no chat, no violence, and no gambling elements,
it should land in the lowest rating tier (Everyone / PEGI 3) in every region — but
Google's questionnaire generates the actual rating, so answer it honestly rather
than assuming.

## 6. Data Safety form (Play Console → App content → Data safety)

Based on what this app actually does:

| Question | Answer |
|---|---|
| Does your app collect or share user data? | Yes |
| Data types collected | **Device or other IDs** (advertising ID, via AdMob) |
| Is data shared with third parties? | Yes — shared with Google (AdMob) for advertising |
| Is data encrypted in transit? | Yes (AdMob SDK traffic is HTTPS) |
| Can users request data deletion? | Not applicable — no account/server-side data is stored by this app |
| Collected for LAN play (name, IP) | Not sent to any server the developer controls, so it's not "collected" in Play's data-safety sense — it's a direct device-to-device transfer on the user's own network. Worth a line in the form's optional notes if you want to be extra explicit. |

Play's UI walks through this interactively and links the AdMob SDK's own declared data
use — when in doubt, defer to what AdMob's own listing there says, since Google keeps
that current as their SDK changes.

## 7. Ads declaration (Play Console → App content → Ads)

Answer **Yes, my app contains ads**.

## 8. Target audience & content

Since this is a general-audience game with ads, and you are *not* specifically
targeting children, declare the target audience as 13+ (or your actual intended
range) rather than "designed for children" — that designation triggers Google
Play Families Policy requirements (stricter ad standards, no behavioral ad
targeting, COPPA-aligned handling) that this app isn't currently built to satisfy
using the standard AdMob integration. If you do want to target children specifically,
say so and this needs a separate pass (a Families-compliant AdMob setup at minimum).

## 9. Before you hit publish

- [x] Real AdMob IDs wired in (step 2) and rebuilt
- [ ] Release AAB builds successfully with `./gradlew bundleRelease` and installs/runs
      on a real device from that AAB (or via `bundletool`)
- [ ] Privacy policy shared as a public link and pasted into Play Console
- [ ] Screenshots captured and uploaded
- [ ] Data Safety and Ads declarations filled in
- [ ] Content rating questionnaire completed
- [ ] Consider submitting to the **Internal testing** track first, install it on your
      own device via the generated link, and play a full game (including a LAN match)
      before promoting to Production
- [ ] `android/keystore.properties` and the `.keystore` file are backed up somewhere
      safe *outside* the project repo (a password manager or encrypted drive) — this
      cannot be regenerated or recovered if lost
