import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/Dashboard'
import AdminEvents from './pages/admin/Events'
import AdminParticipants from './pages/admin/Participants'
import AdminAnalytics from './pages/admin/Analytics'
import StaffScanner from './pages/staff/Scanner'
import StaffCheckIns from './pages/staff/CheckIns'
import ParticipantEvents from './pages/participant/Events'
import MyTickets from './pages/participant/MyTickets'

function AppRoutes() {
  const { isAuthenticated, user } = useAuth()

  const getDashboardRedirect = () => {
    if (!user) return '/login'
    const map = { admin: '/admin', staff: '/staff/scanner', participant: '/events' }
    return map[user.role] || '/events'
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={getDashboardRedirect()} /> : <Landing />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDashboardRedirect()} /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={getDashboardRedirect()} /> : <Register />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']}><Layout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/participants" element={<AdminParticipants />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
      </Route>

      {/* Staff Routes */}
      <Route element={<ProtectedRoute allowedRoles={['staff']}><Layout /></ProtectedRoute>}>
        <Route path="/staff/scanner" element={<StaffScanner />} />
        <Route path="/staff/checkins" element={<StaffCheckIns />} />
      </Route>

      {/* Participant Routes */}
      <Route element={<ProtectedRoute allowedRoles={['participant']}><Layout /></ProtectedRoute>}>
        <Route path="/events" element={<ParticipantEvents />} />
        <Route path="/my-tickets" element={<MyTickets />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
