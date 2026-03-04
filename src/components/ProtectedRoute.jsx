import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading, isAuthenticated } = useAuth()

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="animate-pulse" style={{ color: 'var(--primary-400)', fontSize: 'var(--font-xl)' }}>Loading...</div>
            </div>
        )
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard
        const dashMap = { admin: '/admin', staff: '/staff/scanner', participant: '/events' }
        return <Navigate to={dashMap[user.role] || '/'} replace />
    }

    return children
}
