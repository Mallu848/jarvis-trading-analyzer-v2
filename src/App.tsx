import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import TradeAnalyzer from './pages/TradeAnalyzer'
import OptionsAnalyzer from './pages/OptionsAnalyzer'
import Screener from './pages/Screener'
import Alerts from './pages/Alerts'
import Portfolio from './pages/Portfolio'
import Crypto from './pages/Crypto'
import Journal from './pages/Journal'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analyze" element={<TradeAnalyzer />} />
          <Route path="analyze/:ticker" element={<TradeAnalyzer />} />
          <Route path="options" element={<OptionsAnalyzer />} />
          <Route path="options/:ticker" element={<OptionsAnalyzer />} />
          <Route path="screener" element={<Screener />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="crypto" element={<Crypto />} />
          <Route path="journal" element={<Journal />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
