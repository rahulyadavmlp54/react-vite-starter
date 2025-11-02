import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function DashboardLayout() {
    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            <Sidebar />
            <div className="flex-grow-1">
                {/* <Navbar /> */}
                <div className="p-4">
                    <Outlet /> 
                </div>
            </div>
        </div>
    )
}
