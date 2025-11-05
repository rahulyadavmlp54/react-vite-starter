import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Swal from "sweetalert2";
import { useLoader } from "../context/LoaderContext";
import {
    Home,
    Building,
    PlusCircle,
    ClipboardList,
    CalendarCheck,
    User,
    LogOut,
} from "lucide-react";

export default function Sidebar({ onWidthChange }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoader();
    const [role, setRole] = useState("user");
    const [collapsed, setCollapsed] = useState(true);

    // ✅ Fetch role from Supabase
    useEffect(() => {
        const fetchRole = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
            if (data?.role) setRole(data.role);
        };
        fetchRole();
    }, []);

    // ✅ Notify parent layout when sidebar expands/collapses
    useEffect(() => {
        if (onWidthChange) {
            onWidthChange(collapsed ? 80 : 240);
        }
    }, [collapsed, onWidthChange]);

    const isActive = (path) => location.pathname === path;

    // ✅ Handle logout with loader + SweetAlert
    const handleLogout = async () => {
        const confirm = await Swal.fire({
            title: "Are you sure?",
            text: "You will be logged out of your account.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Logout",
            cancelButtonText: "Cancel",
        });

        if (!confirm.isConfirmed) return;

        try {
            showLoader("Logging out...");
            await supabase.auth.signOut();
            hideLoader();
            Swal.fire("Logged out", "You have been successfully logged out.", "success");
            navigate("/login");
        } catch (err) {
            console.error(err);
            hideLoader();
            Swal.fire("Error", "Logout failed. Please try again.", "error");
        }
    };

    // ✅ Role-based menu structure
    const menuItems =
        role === "admin"
            ? [
                { path: "/", label: "Dashboard", icon: <Home size={20} /> },
                { path: "/properties", label: "All Properties", icon: <Building size={20} /> },
                { path: "/properties/add", label: "Add Property", icon: <PlusCircle size={20} /> },
                { path: "/owner-bookings", label: "All Bookings", icon: <ClipboardList size={20} /> }, // admin sees all
            ]
            : role === "owner"
                ? [
                    { path: "/", label: "Dashboard", icon: <Home size={20} /> },
                    { path: "/properties", label: "My Properties", icon: <Building size={20} /> },
                    { path: "/properties/add", label: "Add Property", icon: <PlusCircle size={20} /> },
                    { path: "/owner-bookings", label: "Owner Bookings", icon: <ClipboardList size={20} /> },
                ]
                : [
                    { path: "/", label: "Dashboard", icon: <Home size={20} /> },
                    { path: "/properties", label: "Browse Properties", icon: <Building size={20} /> },
                    { path: "/my-bookings", label: "My Bookings", icon: <CalendarCheck size={20} /> },
                ];

    return (
        <div
            className="sidebar position-fixed top-0 start-0 h-100 text-white d-flex flex-column"
            onMouseEnter={() => setCollapsed(false)}
            onMouseLeave={() => setCollapsed(true)}
            style={{
                width: collapsed ? "80px" : "240px",
                backgroundColor: "#111827",
                transition: "width 0.3s ease",
                boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
                zIndex: 10,
            }}
        >
            {/* 🔹 Header */}
            <div className="d-flex align-items-center p-3 border-bottom border-secondary">
                <User className="me-2" />
                {!collapsed && <h5 className="fw-bold mb-0">RentEase</h5>}
            </div>

            {/* 🔹 Menu Items */}
            <ul className="nav flex-column px-2 mt-2">
                {menuItems.map((item) => (
                    <li key={item.path} className="nav-item mb-2">
                        <Link
                            to={item.path}
                            className={`nav-link d-flex align-items-center text-white px-3 py-2 rounded ${isActive(item.path) ? "bg-primary" : "hover-bg"
                                }`}
                            style={{
                                textDecoration: "none",
                                fontWeight: 500,
                                transition: "background 0.2s",
                            }}
                        >
                            <span className="me-2">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* 🔹 Footer Section */}
            <div className="mt-auto p-3 border-top border-secondary text-center">
                {!collapsed && (
                    <>
                        <div className="text-secondary small mb-2">
                            {role === "admin"
                                ? "Role: ADMIN (Full Access)"
                                : `Role: ${role?.toUpperCase()}`}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </>
                )}
                {collapsed && (
                    <button
                        onClick={handleLogout}
                        className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}
