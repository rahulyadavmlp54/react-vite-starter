import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
    const [sidebarWidth, setSidebarWidth] = useState(80);

    return (
        <div
            className="d-flex"
            style={{
                minHeight: "100vh",
                backgroundColor: "var(--bg)",
            }}
        >
            {/* Sidebar */}
            <Sidebar onWidthChange={setSidebarWidth} />

            {/* Main Content */}
            <div
                className="main-content flex-grow-1 p-4"
                style={{
                    marginLeft: sidebarWidth,
                    transition: "margin-left 0.3s ease",
                    width: `calc(100% - ${sidebarWidth}px)`,
                }}
            >
                <Outlet />
            </div>
        </div>
    );
}
