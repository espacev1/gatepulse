import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../lib/firebase'
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth'
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [unlockedRole, setUnlockedRole] = useState(null)

    useEffect(() => {
        let unsubscribeProfile = null

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const profileRef = doc(db, 'profiles', firebaseUser.uid)

                    // Initial sync/creation
                    let profileSnap = await getDoc(profileRef)
                    let profile = profileSnap.exists() ? profileSnap.data() : null
                    const isSuperAdmin = firebaseUser.email === 'shanmukhamanikanta.inti@gmail.com'

                    if (!profile || (isSuperAdmin && profile.role !== 'admin')) {
                        const newProfile = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email,
                            full_name: firebaseUser.displayName || 'Admin Entity',
                            role: isSuperAdmin ? 'admin' : (profile?.role || 'participant'),
                            updated_at: serverTimestamp()
                        }
                        await setDoc(profileRef, newProfile, { merge: true })
                    }

                    // Setup real-time listener
                    unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const profileData = docSnap.data()
                            setUser({
                                ...firebaseUser,
                                ...profileData,
                                uid: firebaseUser.uid,
                                is_super_admin: firebaseUser.email === 'shanmukhamanikanta.inti@gmail.com'
                            })
                        }
                    })

                } catch (err) {
                    console.error('Profile sync error:', err)
                }
            } else {
                setUser(null)
                if (unsubscribeProfile) unsubscribeProfile()
            }
            setLoading(false)
        })

        return () => {
            unsubscribeAuth()
            if (unsubscribeProfile) unsubscribeProfile()
        }
    }, [])

    const login = async (email, password, role) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        const profileRef = doc(db, 'profiles', firebaseUser.uid)
        const profileSnap = await getDoc(profileRef)
        let profile = profileSnap.exists() ? profileSnap.data() : null

        if (!profile) {
            const isSuperAdmin = firebaseUser.email === 'shanmukhamanikanta.inti@gmail.com'
            profile = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                full_name: firebaseUser.displayName || (isSuperAdmin ? 'Super Admin' : 'User'),
                role: isSuperAdmin ? 'admin' : 'participant',
                updated_at: serverTimestamp()
            }
            await setDoc(profileRef, profile)
        }

        const isSuperAdmin = firebaseUser.email === 'shanmukhamanikanta.inti@gmail.com'
        const sessionUser = {
            ...firebaseUser,
            ...profile,
            uid: firebaseUser.uid,
            role: isSuperAdmin ? 'admin' : (unlockedRole || profile.role || role),
            is_super_admin: isSuperAdmin
        }

        setUser(sessionUser)
        setUnlockedRole(null)
        return sessionUser
    }

    const register = async (email, password, fullName, role, metadata = {}) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        await updateProfile(firebaseUser, { displayName: fullName })

        const isSuperAdmin = email === 'shanmukhamanikanta.inti@gmail.com'
        const assignedRole = isSuperAdmin ? 'admin' : (role || 'participant')

        const profile = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: fullName,
            role: assignedRole,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            ...metadata
        }

        await setDoc(doc(db, 'profiles', firebaseUser.uid), profile)

        const sessionUser = {
            ...firebaseUser,
            full_name: fullName,
            role: assignedRole,
            is_super_admin: isSuperAdmin
        }

        setUser(sessionUser)
        return sessionUser
    }

    const logout = async () => {
        await signOut(auth)
        setUser(null)
        setUnlockedRole(null)
    }

    const value = { user, loading, login, register, logout, isAuthenticated: !!user, unlockedRole, setUnlockedRole }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
