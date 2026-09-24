import { useEffect } from 'react'
import { showBanner, hideBanner } from './ads'

/**
 * Shows the AdMob banner while the calling screen is mounted, hides it on
 * unmount. A no-op everywhere except the native Android app (see ads.ts).
 * Used only on Home and the Results screens, per the chosen ad placement —
 * never on the Game Board, so a banner can't sit next to tappable cells.
 */
export function useAdBanner() {
  useEffect(() => {
    void showBanner()
    return () => {
      void hideBanner()
    }
  }, [])
}
