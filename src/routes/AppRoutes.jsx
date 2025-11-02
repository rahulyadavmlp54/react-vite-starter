import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '../layout/DashboardLayout'
import Dashboard from '../pages/Dashboard'
import PropertiesList from '../pages/PropertiesList'
import AddProperty from '../pages/AddProperty'
import EditProperty from '../pages/EditProperty'
import ProtectedRoute from './ProtectedRoute'

export default function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="properties" element={<PropertiesList />} />
                <Route path="properties/add" element={<AddProperty />} />
                <Route path="properties/edit/:id" element={<EditProperty />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Route>
        </Routes>
    )
}
