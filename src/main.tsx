import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './lib/theme'
import { SettingsProvider } from './state/SettingsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
)
