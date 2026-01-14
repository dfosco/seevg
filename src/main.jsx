import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Client as Styletron } from 'styletron-engine-monolithic'
import { Provider as StyletronProvider } from 'styletron-react'
import { BaseProvider, DarkTheme } from 'baseui'
import './index.css'
import App from './App.jsx'

const engine = new Styletron()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StyletronProvider value={engine}>
      <BaseProvider theme={DarkTheme}>
        <App />
      </BaseProvider>
    </StyletronProvider>
  </StrictMode>,
)
