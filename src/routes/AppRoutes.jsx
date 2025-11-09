import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import Dashboard from "../pages/Dashboard";
import PropertiesList from "../pages/PropertiesList";
import AddProperty from "../pages/AddProperty";
import EditProperty from "../pages/EditProperty";
import PropertyDetail from "../pages/PropertyDetail";
import BookProperty from "../pages/BookProperty";
import MyBookings from "../pages/MyBookings";
import OwnerBookings from "../pages/OwnerBookings";
import UsersList from "../pages/UsersList"; // ✅ Added this import
import ProtectedRoute from "./ProtectedRoute";

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
                {/* Dashboard */}
                <Route index element={<Dashboard />} />

                {/* Property Management */}
                <Route path="properties" element={<PropertiesList />} />
                <Route path="properties/add" element={<AddProperty />} />
                <Route path="properties/edit/:id" element={<EditProperty />} />
                <Route path="properties/:id" element={<PropertyDetail />} />

                {/* Booking Flow */}
                <Route path="properties/book/:id" element={<BookProperty />} />
                <Route path="my-bookings" element={<MyBookings />} />
                <Route path="owner-bookings" element={<OwnerBookings />} />

                {/* ✅ Admin Management */}
                <Route path="users" element={<UsersList />} />  {/* New Admin Users tab */}

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Route>
        </Routes>
    );
}
