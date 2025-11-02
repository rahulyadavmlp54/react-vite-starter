import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'
import { useLoader } from '../context/LoaderContext'

export default function Register() {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        password: '',
    })
    const [message, setMessage] = useState('')
    const { showLoader, hideLoader } = useLoader()

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setMessage('')
        showLoader('Logging in...')
        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
        })
        hideLoader()
        if (error) {
            setMessage(error.message)
            return
        }

        const user = data.user
        if (user) {
            await supabase.from('profiles').insert([
                {
                    id: user.id,
                    first_name: form.first_name,
                    last_name: form.last_name,
                    email: form.email,
                    phone_number: form.phone_number,
                },
            ])
            setMessage('✅ Registration successful! Please check your email to verify.')
            setForm({ first_name: '', last_name: '', email: '', phone_number: '', password: '' })
        }
    }

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <div className="card shadow-lg p-4" style={{ maxWidth: '500px', width: '100%' }}>
                <div className="card-body">
                    <h3 className="text-center mb-4 fw-bold text-primary">Create Account</h3>
                    <form onSubmit={handleRegister}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">First Name</label>
                                <input
                                    name="first_name"
                                    className="form-control"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Last Name</label>
                                <input
                                    name="last_name"
                                    className="form-control"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-control"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Phone Number</label>
                            <input
                                name="phone_number"
                                className="form-control"
                                value={form.phone_number}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="form-control"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-100 mb-3">
                            Register
                        </button>
                        <p className="text-center mb-0">
                            Already have an account?{' '}
                            <Link to="/login" className="text-success fw-semibold">
                                Login
                            </Link>
                        </p>
                    </form>

                    {message && <div className="alert alert-info mt-3 text-center">{message}</div>}
                </div>
            </div>
        </div>
    )
}
