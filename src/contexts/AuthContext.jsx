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

                    // Robustness: If profile missing or role out of sync for Super Admin
                    const isSuperAdmin = session.user.email === 'shanmukhamanikanta.inti@gmail.com'

                    if (!profile || (isSuperAdmin && profile.role !== 'admin')) {
                        const { data: newProfile, error: pError } = await supabase.from('profiles').upsert({
                            id: session.user.id,
                            email: session.user.email,
                            full_name: profile?.full_name || session.user.user_metadata?.full_name || 'Admin Entity',
                            role: isSuperAdmin ? 'admin' : (profile?.role || 'participant')
                        }, { onConflict: 'id' }).select().single()

                        if (!pError) profile = newProfile
                        else console.error('Profile sync failed:', pError)
                    }

                    if (profile) {
                        const isSuperAdmin = session.user.email?.toLowerCase() === 'shanmukhamanikanta.inti@gmail.com'
                        const metadataRole = session.user.user_metadata?.role
                        let effectiveRole = isSuperAdmin ? 'admin' : profile.role

                        // Critical Fix: If it's the super admin email, always force admin role
                        if (isSuperAdmin && profile.role !== 'admin') {
                            await supabase.from('profiles').update({ role: 'admin' }).eq('id', profile.id)
                        }

                        if (!isSuperAdmin && effectiveRole === 'participant' && metadataRole && metadataRole !== 'participant') {
                            effectiveRole = metadataRole
                            await supabase.from('profiles').update({ role: effectiveRole }).eq('id', profile.id)
                        }

                        // Check faculty whitelist
                        if (effectiveRole !== 'faculty' && effectiveRole !== 'admin') {
                            const { data: whitelisted } = await supabase
                                .from('faculty_whitelist')
                                .select('email')
                                .eq('email', profile.email?.toLowerCase())
                                .single()

                            if (whitelisted) {
                                await supabase.from('profiles').update({ role: 'faculty' }).eq('id', profile.id)
                                effectiveRole = 'faculty'
                            }
                        }

                        const sessionUser = {
                            ...session.user,
                            ...profile,
                            role: effectiveRole,
                            is_super_admin: isSuperAdmin
                        }
                        setUser(sessionUser)
                        localStorage.setItem('gatepulse_user', JSON.stringify(sessionUser))
                    }
                }
            } catch (err) {
                console.error('Session initialization error:', err)
            } finally {
                setLoading(false)
            }
        }
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                setUser(null)
                localStorage.removeItem('gatepulse_user')
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (event === 'INITIAL_SESSION' && session)) {
                checkSession()
            }
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

        if (!profile || profileError) {
            const isSuperAdmin = data.user.email === 'shanmukhamanikanta.inti@gmail.com'
            const profileData = {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || (isSuperAdmin ? 'Super Admin' : 'User'),
                role: isSuperAdmin ? 'admin' : 'participant'
            }

            const { data: upserted, error: upsertErr } = await supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' })
                .select()
                .single()

            if (upsertErr) throw upsertErr
            profile = upserted || profileData
        }

        // Check whitelist before finalizing role
        if (profile?.role !== 'faculty') {
            const { data: whitelisted } = await supabase
                .from('faculty_whitelist')
                .select('email')
                .eq('email', (profile?.email || data.user.email).toLowerCase())
                .single()

            if (whitelisted) {
                await supabase.from('profiles').update({ role: 'faculty' }).eq('id', profile?.id || data.user.id)
                if (profile) profile.role = 'faculty'
            }
        }

        const isSuperAdmin = data.user.email?.toLowerCase() === 'shanmukhamanikanta.inti@gmail.com'
        const finalRole = isSuperAdmin ? 'admin' : (unlockedRole || profile.role || role || 'participant')
        
        // Sync profile role if it's the super admin
        if (isSuperAdmin && profile?.role !== 'admin') {
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', profile?.id || data.user.id)
        }

        const sessionUser = {
            ...data.user,
            ...(profile || {}),
            role: finalRole,
            is_super_admin: isSuperAdmin
        }

        setUser(sessionUser)
        localStorage.setItem('gatepulse_user', JSON.stringify(sessionUser))
        setUnlockedRole(null)
        return sessionUser
    }


    const register = async (email, password, fullName, role, metadata = {}) => {
        const isSuperAdmin = email === 'shanmukhamanikanta.inti@gmail.com'
        const assignedRole = isSuperAdmin ? 'admin' : (role || 'participant')

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: assignedRole,
                    ...metadata
                }
            }
        })
        if (error) throw error

        if (!data.user) throw new Error('Registration failed: User identity not established.')

        // The profile is created by the database trigger (handle_new_user).
        // We attempt a client-side update only if a session exists (to satisfy RLS).
        // Even if this fails due to RLS, the trigger has already provisioned the core identity.
        if (data.session) {
            try {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email: data.user.email || email,
                    full_name: fullName,
                    role: assignedRole,
                    ...metadata
                }, { onConflict: 'id' })
            } catch (pError) {
                console.warn('Profile client-sync skipped (Identity preserved by trigger):', pError)
            }
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
