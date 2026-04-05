import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/layout/Layout'
import { AuthGuard } from './components/auth/AuthGuard'
import Landing from './pages/Landing'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AnalysisResults from './pages/AnalysisResults'
import Tracker from './pages/Tracker'
import Settings from './pages/Settings'
import JobSearch from './pages/JobSearch'
import CvAnalysisReport from './pages/CvAnalysisReport'

function AppRoutes() {
  const { initialize } = useAuth()

  useEffect(() => {
    const cleanup = initialize()
    return cleanup
  }, [initialize])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/analysis/:id"
          element={
            <AuthGuard>
              <AnalysisResults />
            </AuthGuard>
          }
        />
        <Route
          path="/tracker"
          element={
            <AuthGuard>
              <Tracker />
            </AuthGuard>
          }
        />
        <Route path="/job-search" element={<JobSearch />} />
        <Route path="/cv-report" element={<CvAnalysisReport />} />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          }
        />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
