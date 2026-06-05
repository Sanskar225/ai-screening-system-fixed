import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage    from './pages/LandingPage'
import SetupPage      from './pages/SetupPage'
import InterviewPage  from './pages/InterviewPage'
import ReportPage     from './pages/ReportPage'
import DashboardPage  from './pages/DashboardPage'

export default function App() {
  return (
    <Routes>
      <Route path="/"                       element={<LandingPage />} />
      <Route path="/setup"                  element={<SetupPage />} />
      <Route path="/interview/:sessionId"   element={<InterviewPage />} />
      <Route path="/report/:sessionId"      element={<ReportPage />} />
      <Route path="/dashboard"              element={<DashboardPage />} />
      <Route path="*"                       element={<Navigate to="/" replace />} />
    </Routes>
  )
}
