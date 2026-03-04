import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [unlockedRole, setUnlockedRole] = useState(null)

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    let { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()

                    // Robustness: If profile missing (e.g. after wipe), try to recover it
                    if (!profile) {
                        const isSuperAdmin = session.user.email === 'shanmukhamanikanta.inti@gmail.com'
                        const { data: newProfile, error: pError } = await supabase.from('profiles').upsert({
                            id: session.user.id,
                            email: session.user.email,
                            full_name: session.user.user_metadata?.full_name || 'Admin Entity',
                            role: isSuperAdmin ? 'admin' : 'participant'
                        }, { onConflict: 'id' }).select().single()

                        if (!pError) profile = newProfile
                        else {
                            console.error('Profile recovery failed:', pError)
                            // If we can't create a profile, the user is in a "broken" state
                        }
                    }

                    if (profile) {
                        setUser({
                            ...session.user,
                            ...profile,
                            is_super_admin: profile.email === 'shanmukhamanikanta.inti@gmail.com'
                        })
                    }
                }
            } catch (err) {
                console.error('Session initialization error:', err)
            } finally {
                setLoading(false)
            }
        }
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setUser(null)
                localStorage.removeItem('gatepulse_user')
            }
            // We don't force setLoading(false) here because checkSession handles initial load
        })

        return () => subscription.unsubscribe()
    }, [])

    const login = async (email, password, role) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

        // Recovery logic for missing profiles — use upsert to handle conflicts
        if (!profile || profileError) {
            const isSuperAdmin = data.user.email === 'shanmukhamanikanta.inti@gmail.com'
            const profileData = {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || (isSuperAdmin ? 'Super Admin' : 'User'),
                role: isSuperAdmin ? 'admin' : 'participant'
            }

            // Try upsert first (handles both insert and conflict)
            const { data: upserted, error: upsertErr } = await supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' })
                .select()
                .single()

            if (upsertErr) {
                console.error('Profile recovery failed during login:', upsertErr)
                throw new Error(`Profile synchronization failed: ${upsertErr.message}. Ensure your database schema is up to date.`)
            } else {
                profile = upserted
            }
        }

        const isSuperAdmin = (profile.email || email) === 'shanmukhamanikanta.inti@gmail.com'
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


    const register = async (email, password, fullName, role, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        })
        if (error) throw error

        if (!data.user) throw new Error('Registration failed: User identity not established.')

        const isSuperAdmin = email === 'shanmukhamanikanta.inti@gmail.com'
        const assignedRole = isSuperAdmin ? 'admin' : 'participant'

        // Always create profile in DB — don't gate behind session check
        // (session may be null if email confirmation is enabled)
        // Always create profile in DB — don't gate behind session check
        const { error: pError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email || email,
            full_name: fullName,
            role: assignedRole,
            ...metadata
        }, { onConflict: 'id' })

        if (pError) {
            console.error('Profile creation failed:', pError)
            throw new Error(`Profile creation failed: ${pError.message}. Please check if the database columns exist.`)
        }

        const sessionUser = {
            ...data.user,
            full_name: fullName,
            role: assignedRole,
            is_super_admin: isSuperAdmin
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
