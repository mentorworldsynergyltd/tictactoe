// Thin AdMob wrapper. Every function is a no-op on the web build (or in a
// browser tab that isn't the native Android app) — ads only ever show
// inside the Capacitor-wrapped app, never on the plain website, so none of
// this can affect the existing web/LAN experience.
//
// Real AdMob ad unit IDs from the developer's AdMob console, matching the
// admob_app_id string in android/app/src/main/res/values/strings.xml.
import { Capacitor } from '@capacitor/core'

const AD_UNIT_IDS = {
  banner: 'ca-app-pub-5745424554460135/9836176693',
  interstitial: 'ca-app-pub-5745424554460135/8623167378',
  rewarded: 'ca-app-pub-5745424554460135/2736415879',
}

// Show an interstitial after every Nth completed game, not every single one
// — back-to-back interstitials are both against AdMob policy and annoying.
const INTERSTITIAL_EVERY_N_GAMES = 3

function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

let initPromise: Promise<void> | null = null
let interstitialReady = false
let rewardedReady = false

/**
 * Initializes the Mobile Ads SDK once per app session. Safe to call from
 * multiple screens — subsequent calls reuse the same in-flight/resolved
 * promise. No-ops on web.
 */
export function initAds(): Promise<void> {
  if (!isNativeAndroid()) return Promise.resolve()
  if (initPromise) return initPromise

  initPromise = (async () => {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.initialize()
    try {
      // Best-effort — a consent form is only shown if the user's region
      // requires one (UMP/GDPR). Never block app usage on this.
      const consentInfo = await AdMob.requestConsentInfo()
      if (!consentInfo.canRequestAds && consentInfo.isConsentFormAvailable) {
        await AdMob.showConsentForm()
      }
    } catch {
      // Consent flow is best-effort; ads can still be requested (as
      // non-personalized) even if this step fails.
    }
    void prepareInterstitial()
    void prepareRewarded()
  })()

  return initPromise
}

async function prepareInterstitial() {
  if (!isNativeAndroid()) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.prepareInterstitial({ adId: AD_UNIT_IDS.interstitial })
    interstitialReady = true
  } catch {
    interstitialReady = false
  }
}

async function prepareRewarded() {
  if (!isNativeAndroid()) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.prepareRewardVideoAd({ adId: AD_UNIT_IDS.rewarded })
    rewardedReady = true
  } catch {
    rewardedReady = false
  }
}

/** Shows a small anchored banner. Call once per screen mount; pair with hideBanner() on unmount. */
export async function showBanner(): Promise<void> {
  if (!isNativeAndroid()) return
  await initAds()
  try {
    const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob')
    await AdMob.showBanner({
      adId: AD_UNIT_IDS.banner,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    })
  } catch {
    // Ad failed to load (e.g. no connectivity) — the screen works fine
    // without it, so this is deliberately swallowed.
  }
}

export async function hideBanner(): Promise<void> {
  if (!isNativeAndroid()) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.removeBanner()
  } catch {
    // Nothing to remove — fine.
  }
}

/**
 * Shows an interstitial roughly every `INTERSTITIAL_EVERY_N_GAMES` completed
 * games. Pass the running `gamesPlayed` count from whichever match just
 * finished (local, AI, or LAN). Never throws — worst case, no ad shows.
 */
export async function maybeShowInterstitial(gamesPlayed: number): Promise<void> {
  if (!isNativeAndroid()) return
  if (gamesPlayed < 1 || gamesPlayed % INTERSTITIAL_EVERY_N_GAMES !== 0) return
  await initAds()
  if (!interstitialReady) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.showInterstitial()
  } catch {
    // Swallow — a missed ad shouldn't block starting the next game.
  } finally {
    interstitialReady = false
    void prepareInterstitial()
  }
}

/**
 * Shows a rewarded ad and resolves `true` only if the player watched it
 * through to completion (AdMob's Rewarded event). Resolves `false` on web,
 * on failure, or if the player closes it early — callers should treat
 * `false` as "no hint," not as an error.
 */
export async function showRewardedHint(): Promise<boolean> {
  if (!isNativeAndroid()) return false
  await initAds()
  if (!rewardedReady) return false
  try {
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob')
    const earned = new Promise<boolean>((resolve) => {
      AdMob.addListener(RewardAdPluginEvents.Rewarded, () => resolve(true))
      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => resolve(false))
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => resolve(false))
    })
    await AdMob.showRewardVideoAd()
    return await earned
  } catch {
    return false
  } finally {
    rewardedReady = false
    void prepareRewarded()
  }
}
