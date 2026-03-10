import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from './Loader'

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading, isAuthenticated } = useAuth()

    if (loading) {
        return <Loader fullScreen message="AUTHORIZING..." />
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard
        const dashMap = { admin: '/admin', staff: '/staff/scanner', participant: '/events' }
        return <Navigate to={dashMap[user.role] || '/'} replace />
    }

    return children
}
