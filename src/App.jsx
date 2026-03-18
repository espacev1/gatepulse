import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AccessModal from './components/AccessModal'
import MagicRings from './components/MagicRings'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/Dashboard'
import AdminEvents from './pages/admin/Events'
import AdminParticipants from './pages/admin/Participants'
import AdminAnalytics from './pages/admin/Analytics'
import AdminUsers from './pages/admin/Users'
import AdminAttendance from './pages/admin/Attendance'
import AdminJury from './pages/admin/JuryManagement'
import AdminFaculty from './pages/admin/FacultyVerification'
import AdminActiveEvents from './pages/admin/ActiveEvents'
import AdminEventSynopsis from './pages/admin/EventSynopsis'
import AdminJuryLive from './pages/admin/JuryLive'
import StaffScanner from './pages/staff/Scanner'
import StaffCheckIns from './pages/staff/CheckIns'
import StaffAttendance from './pages/staff/Attendance'
import FacultyDashboard from './pages/faculty/Dashboard'
import FacultyEvents from './pages/faculty/Events'
import FacultyAttendance from './pages/faculty/Attendance'
import FacultyUsers from './pages/faculty/Users'
import FacultyJuryLive from './pages/faculty/JuryLive'
import FacultyActiveEvents from './pages/faculty/ActiveEvents'
import ParticipantEvents from './pages/participant/Events'
import MyTickets from './pages/participant/MyTickets'
import ParticipantAttendance from './pages/participant/Attendance'
import MyQR from './pages/participant/MyQR'
import Profile from './pages/shared/Profile'
import JuryPortal from './pages/jury/Portal'
import DepartmentView from './pages/shared/DepartmentView'
import FacultyCreateEvent from './pages/faculty/CreateEvents'

function AppRoutes() {
  const { isAuthenticated, user, setUnlockedRole } = useAuth()
  const navigate = useNavigate()
  const [accessModal, setAccessModal] = useState({ open: false, type: null })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'q') {
        e.preventDefault()
        setAccessModal({ open: true, type: 'admin' })
      } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setAccessModal({ open: true, type: 'faculty' })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleVerified = (role) => {
    setUnlockedRole(role)
    const dashMap = { 
      admin: '/admin', 
      staff: '/staff/scanner', 
      participant: '/events',
      faculty: '/faculty',
      jury: '/jury'
    }

    if (isAuthenticated && (user.role === role || user.email === 'shanmukhamanikanta.inti@gmail.com')) {
      navigate(dashMap[role] || '/')
    } else {
      navigate('/login', { state: { requestedRole: role } })
    }
  }

  const getDashboardRedirect = () => {
    if (!user) return '/login'
    const map = { 
      admin: '/admin', 
      staff: '/staff/scanner', 
      participant: '/events',
      faculty: '/faculty',
      jury: '/jury/dashboard'
    }
    return map[user.role] || '/events'
  }

  return (
    <>
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
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/jury" element={<AdminJury />} />
          <Route path="/admin/faculty" element={<AdminFaculty />} />
          <Route path="/admin/active-events" element={<AdminActiveEvents />} />
          <Route path="/admin/synopsis" element={<AdminEventSynopsis />} />
          <Route path="/admin/department-view" element={<DepartmentView />} />
          <Route path="/admin/jury-live" element={<AdminJuryLive />} />
          <Route path="/admin/profile" element={<Profile />} />
        </Route>

        {/* Staff Routes */}
        <Route element={<ProtectedRoute allowedRoles={['staff']}><Layout /></ProtectedRoute>}>
          <Route path="/staff/scanner" element={<StaffScanner />} />
          <Route path="/staff/checkins" element={<StaffCheckIns />} />
          <Route path="/staff/attendance" element={<StaffAttendance />} />
          <Route path="/staff/profile" element={<Profile />} />
        </Route>

        {/* Faculty Routes */}
        <Route element={<ProtectedRoute allowedRoles={['faculty']}><Layout /></ProtectedRoute>}>
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/events" element={<FacultyEvents />} />
          <Route path="/faculty/create-events" element={<FacultyCreateEvent />} />
          <Route path="/faculty/department-view" element={<DepartmentView />} />
          <Route path="/faculty/attendance" element={<FacultyAttendance />} />
          <Route path="/faculty/users" element={<FacultyUsers />} />
          <Route path="/faculty/jury" element={<FacultyJuryLive />} />
          <Route path="/faculty/active-events" element={<FacultyActiveEvents />} />
          <Route path="/faculty/profile" element={<Profile />} />
        </Route>

        {/* Jury Routes */}
        <Route path="/jury/login" element={isAuthenticated && (!user.is_super_admin || user.role === 'jury') ? <Navigate to={`/jury/dashboard${window.location.search}`} replace /> : <Login portalType="jury" />} />
        <Route element={<ProtectedRoute allowedRoles={['jury']}><Layout /></ProtectedRoute>}>
          <Route path="/jury/dashboard" element={<JuryPortal view="live" />} />
          <Route path="/jury/status" element={<JuryPortal view="status" />} />
          <Route path="/jury/profile" element={<Profile />} />
        </Route>

        {/* Participant Routes */}
        <Route element={<ProtectedRoute allowedRoles={['participant']}><Layout /></ProtectedRoute>}>
          <Route path="/events" element={<ParticipantEvents />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/my tickets" element={<Navigate to="/my-tickets" replace />} />
          <Route path="/attendance" element={<ParticipantAttendance />} />
          <Route path="/my-qr" element={<MyQR />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AccessModal
        isOpen={accessModal.open}
        onClose={() => setAccessModal({ open: false, type: null })}
        type={accessModal.type}
        onVerified={handleVerified}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-main-container" style={{ position: 'relative', zIndex: 1 }}>
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}
