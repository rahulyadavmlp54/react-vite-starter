import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import { useLoader } from '../context/LoaderContext'

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const { showLoader, hideLoader } = useLoader()

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser()
            if (data?.user) {
            }
        }
        checkUser()
    }, [navigate])

    const handleLogin = async (e) => {
        debugger
        e.preventDefault()
        setMessage('')
        showLoader('Logging in...')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        hideLoader()
        if (error) setMessage(error.message)
        else navigate('/') // ✅ Go to dashboard
    }

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <div className="card shadow-lg p-4" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="card-body">
                    <h3 className="text-center mb-4 fw-bold text-primary">Login</h3>
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-success w-100 mb-3">
                            Login
                        </button>
                        <p className="text-center mb-0">
                            Don’t have an account?{' '}
                            <Link to="/register" className="text-primary fw-semibold">
                                Register
                            </Link>
                        </p>
                    </form>
                    {message && <div className="alert alert-info mt-3 text-center">{message}</div>}
                </div>
            </div>
        </div>
    )
}