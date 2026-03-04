import { createContext, useContext, useState, useEffect } from 'react'
import { mockUsers } from '../data/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for persisted session
        const saved = localStorage.getItem('gatepulse_user')
        if (saved) {
            try { setUser(JSON.parse(saved)) } catch { }
        }
        setLoading(false)
    }, [])

    const login = async (email, password, role) => {
        // Demo mode — match by email or fallback to role-based mock user
        const demoUser = mockUsers.find(u => u.email === email) ||
            mockUsers.find(u => u.role === role) ||
            mockUsers[0]

        const sessionUser = { ...demoUser, role: role || demoUser.role }
        setUser(sessionUser)
        localStorage.setItem('gatepulse_user', JSON.stringify(sessionUser))
        return sessionUser
    }

    const register = async (email, password, fullName, role) => {
        const newUser = {
            id: `user-${Date.now()}`,
            email,
            full_name: fullName,
            role: role || 'participant',
            avatar: null,
        }
        setUser(newUser)
        localStorage.setItem('gatepulse_user', JSON.stringify(newUser))
        return newUser
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('gatepulse_user')
    }

    const value = { user, loading, login, register, logout, isAuthenticated: !!user }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
