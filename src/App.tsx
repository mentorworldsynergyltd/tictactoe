import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { HomeScreen } from './screens/HomeScreen'
import { PlayerSetupScreen } from './screens/PlayerSetupScreen'
import { AiSetupScreen } from './screens/AiSetupScreen'
import { GameBoardScreen } from './screens/GameBoardScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { HowToPlayScreen } from './screens/HowToPlayScreen'
import { AboutScreen } from './screens/AboutScreen'
import { LanLobbyScreen } from './screens/LanLobbyScreen'
import { CreateLanGameScreen } from './screens/CreateLanGameScreen'
import { HostWaitingRoomScreen } from './screens/HostWaitingRoomScreen'
import { JoinLanGameScreen } from './screens/JoinLanGameScreen'
import { LanGameBoardScreen } from './screens/LanGameBoardScreen'
import { LanResultsScreen } from './screens/LanResultsScreen'
import { OnlineLobbyScreen } from './screens/OnlineLobbyScreen'
import { CreateOnlineGameScreen } from './screens/CreateOnlineGameScreen'
import { JoinOnlineGameScreen } from './screens/JoinOnlineGameScreen'
import { LocalGameProvider } from './state/LocalGameContext'
import { LanGameProvider } from './state/LanGameContext'
import { PageTransition } from './components/PageTransition'
import { useSettings } from './state/SettingsContext'

function App() {
  const location = useLocation()
  const { settings } = useSettings()

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="mx-auto min-h-screen w-full max-w-3xl">
        <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'user'}>
          <LocalGameProvider>
            <LanGameProvider>
              <AnimatePresence mode="wait" initial={false}>
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<PageTransition><HomeScreen /></PageTransition>} />
                  <Route path="/local/setup" element={<PageTransition><PlayerSetupScreen /></PageTransition>} />
                  <Route path="/ai/setup" element={<PageTransition><AiSetupScreen /></PageTransition>} />
                  <Route path="/local/game" element={<PageTransition><GameBoardScreen /></PageTransition>} />
                  <Route path="/local/results" element={<PageTransition><ResultsScreen /></PageTransition>} />
                  <Route path="/lan" element={<PageTransition><LanLobbyScreen /></PageTransition>} />
                  <Route path="/lan/create" element={<PageTransition><CreateLanGameScreen /></PageTransition>} />
                  <Route path="/lan/host" element={<PageTransition><HostWaitingRoomScreen /></PageTransition>} />
                  <Route path="/lan/join" element={<PageTransition><JoinLanGameScreen /></PageTransition>} />
                  <Route path="/lan/game" element={<PageTransition><LanGameBoardScreen /></PageTransition>} />
                  <Route path="/lan/results" element={<PageTransition><LanResultsScreen /></PageTransition>} />
                  <Route path="/online" element={<PageTransition><OnlineLobbyScreen /></PageTransition>} />
                  <Route path="/online/create" element={<PageTransition><CreateOnlineGameScreen /></PageTransition>} />
                  <Route path="/online/join" element={<PageTransition><JoinOnlineGameScreen /></PageTransition>} />
                  <Route path="/settings" element={<PageTransition><SettingsScreen /></PageTransition>} />
                  <Route path="/how-to-play" element={<PageTransition><HowToPlayScreen /></PageTransition>} />
                  <Route path="/about" element={<PageTransition><AboutScreen /></PageTransition>} />
                </Routes>
              </AnimatePresence>
            </LanGameProvider>
          </LocalGameProvider>
        </MotionConfig>
      </div>
    </div>
  )
}

export default App
