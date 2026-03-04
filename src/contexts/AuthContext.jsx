import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [unlockedRole, setUnlockedRole] = useState(null)

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                if (profile) {
                    setUser({
                        ...session.user,
                        ...profile,
                        is_super_admin: profile.email === 'shanmukhamanikanta.inti@gmail.com'
                    })
                }
            } else {
                // Fallback to local storage for demo persistence if needed, 
                // but prioritize real session
                const saved = localStorage.getItem('gatepulse_user')
                if (saved) {
                    try { setUser(JSON.parse(saved)) } catch { }
                }
            }
            setLoading(false)
        }
        checkSession()
    }, [])

    const login = async (email, password, role) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

        if (!profile) throw new Error('Profile not found')

        const isSuperAdmin = profile.email === 'shanmukhamanikanta.inti@gmail.com'
        const sessionUser = {
            ...data.user,
            ...profile,
            role: isSuperAdmin ? 'admin' : (unlockedRole || profile.role || role),
            is_super_admin: isSuperAdmin
        }

        setUser(sessionUser)
        localStorage.setItem('gatepulse_user', JSON.stringify(sessionUser))
        setUnlockedRole(null)
        return sessionUser
    }

    const register = async (email, password, fullName, role) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        })
        if (error) throw error

        if (!data.user) throw new Error('Registration failed: User identity not established.')

        const sessionUser = {
            ...data.user,
            full_name: fullName,
            role: email === 'shanmukhamanikanta.inti@gmail.com' ? 'admin' : 'participant'
        }
        setUser(sessionUser)
        localStorage.setItem('gatepulse_user', JSON.stringify(sessionUser))

        if (!data.session) {
            throw new Error('Entity Provisioned. Please check your deployment email for activation instructions.')
        }

        return sessionUser
    }

    const logout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setUnlockedRole(null)
        localStorage.removeItem('gatepulse_user')
    }

    const value = { user, loading, login, register, logout, isAuthenticated: !!user, unlockedRole, setUnlockedRole }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
