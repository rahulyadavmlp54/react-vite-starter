import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLoader } from '../context/LoaderContext'

export default function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const { showLoader, hideLoader } = useLoader()

    useEffect(() => {
        const checkSession = async () => {
            showLoader('Verifying session...')
            const { data, error } = await supabase.auth.getSession()
            hideLoader()

            if (error) {
                console.error('Session check error:', error)
                setAuthenticated(false)
            } else {
                setAuthenticated(!!data?.session)
            }

            setLoading(false)
        }

        checkSession()

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuthenticated(!!session)
        })

        return () => listener.subscription.unsubscribe()
        // ✅ removed showLoader/hideLoader from deps to prevent infinite loop
    }, [])

    if (loading) return <div className="text-center mt-5">Loading...</div>

    return authenticated ? children : <Navigate to="/login" replace />
}
