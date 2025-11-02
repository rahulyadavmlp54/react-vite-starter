import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { House, PlusCircle, List, LogOut } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Sidebar() {
    const [expanded, setExpanded] = useState(false)
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            navigate('/login') // ✅ Redirect to login after logout
        } catch (error) {
            console.error('Logout error:', error.message)
        }
    }

    const menuItems = [
        { icon: <House />, label: 'Dashboard', path: '/' },
        { icon: <List />, label: 'Properties', path: '/properties' },
        { icon: <PlusCircle />, label: 'Add Property', path: '/properties/add' },
    ]

    return (
        <div
            className={`bg-dark text-light d-flex flex-column align-items-${expanded ? 'start' : 'center'}`}
            style={{
                width: expanded ? '200px' : '70px',
                transition: 'width 0.3s',
                paddingTop: '1rem',
            }}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            <h5 className="text-center mb-4 fw-bold ms-2">{expanded ? 'MyApp' : '🏠'}</h5>

            <ul className="nav flex-column w-100">
                {menuItems.map((item, idx) => (
                    <li className="nav-item mb-3" key={idx}>
                        <Link
                            to={item.path}
                            className="nav-link text-light d-flex align-items-center gap-2 px-3"
                        >
                            {item.icon}
                            {expanded && <span>{item.label}</span>}
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="mt-auto mb-3 px-3">
                <button className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleLogout}>
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    )
}
