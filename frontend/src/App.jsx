import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import StockAnalysis from './pages/StockAnalysis'
import Watchlist from './pages/Watchlist'
import Compare from './pages/Compare'
import History from './pages/History'
import Alerts from './pages/Alerts'
import Forecast from './pages/Forecast'
import Profile from './pages/Profile'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAnalyses from './pages/admin/AdminAnalyses'

const publicPaths = ['/', '/login', '/register', '/admin/login']

function AppLayout() {
  const location = useLocation()
  const isPublicPage = publicPaths.includes(location.pathname)

  if (isPublicPage) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-[240px] min-h-screen">
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/stocks/:symbol" element={<ProtectedRoute><StockAnalysis /></ProtectedRoute>} />
          <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/forecasts" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/analyses" element={<AdminRoute><AdminAnalyses /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}
