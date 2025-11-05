import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import { Link } from "react-router-dom";
import {
  Building,
  CalendarCheck,
  PlusCircle,
  ClipboardList,
  Home,
} from "lucide-react";

export default function Dashboard() {
  const { showLoader, hideLoader } = useLoader();
  const [role, setRole] = useState("");
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalBookings: 0,
    upcomingBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      showLoader("Loading dashboard...");
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const currentRole = profile?.role || "user";
        setRole(currentRole);

        // Fetch counts
        if (currentRole === "admin") {
          // Admin-specific stats
          const { count: propertyCount } = await supabase
            .from("properties")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user.id);

          const { count: bookingCount } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user.id);

          const { data: upcoming } = await supabase
            .from("bookings")
            .select("*")
            .eq("owner_id", user.id)
            .gte("check_in", new Date().toISOString())
            .order("check_in", { ascending: true })
            .limit(3);

          setStats({
            totalProperties: propertyCount || 0,
            totalBookings: bookingCount || 0,
            upcomingBookings: upcoming?.length || 0,
          });
          setRecentBookings(upcoming || []);
        } else {
          // User-specific stats
          const { count: myBookings } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          const { data: upcoming } = await supabase
            .from("bookings")
            .select("*, properties(name)")
            .eq("user_id", user.id)
            .gte("check_in", new Date().toISOString())
            .order("check_in", { ascending: true })
            .limit(3);

          setStats({
            totalProperties: 0,
            totalBookings: myBookings || 0,
            upcomingBookings: upcoming?.length || 0,
          });
          setRecentBookings(upcoming || []);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        hideLoader();
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="container-fluid py-4 px-4">
      <h2 className="fw-bold mb-4">
        <Home className="me-2" />
        {role === "admin" ? "Admin Dashboard" : "User Dashboard"}
      </h2>

      {/* Stats Cards */}
      <div className="row g-4">
        {role === "admin" && (
          <div className="col-md-4">
            <div className="card shadow-sm border-0 p-3 text-center">
              <Building size={28} className="text-primary mb-2" />
              <h5>Total Properties</h5>
              <h3 className="fw-bold">{stats.totalProperties}</h3>
            </div>
          </div>
        )}

        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 text-center">
            <CalendarCheck size={28} className="text-success mb-2" />
            <h5>Total Bookings</h5>
            <h3 className="fw-bold">{stats.totalBookings}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 text-center">
            <ClipboardList size={28} className="text-warning mb-2" />
            <h5>Upcoming Bookings</h5>
            <h3 className="fw-bold">{stats.upcomingBookings}</h3>
          </div>
        </div>
      </div>

      {/* Recent Section */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Recent / Upcoming Bookings</h4>
          {role === "admin" ? (
            <Link to="/owner-bookings" className="btn btn-outline-primary btn-sm">
              View All
            </Link>
          ) : (
            <Link to="/my-bookings" className="btn btn-outline-primary btn-sm">
              View All
            </Link>
          )}
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-muted">No upcoming bookings found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.properties?.name || "N/A"}</td>
                    <td>{new Date(b.check_in).toLocaleDateString()}</td>
                    <td>{new Date(b.check_out).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`badge bg-${b.status === "confirmed"
                          ? "success"
                          : b.status === "pending"
                            ? "warning"
                            : "secondary"
                          }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {role === "admin" && (
        <div className="mt-5">
          <h4>Quick Actions</h4>
          <div className="d-flex gap-3 mt-3">
            <Link to="/properties/add" className="btn btn-primary d-flex align-items-center">
              <PlusCircle size={18} className="me-2" />
              Add New Property
            </Link>
            <Link to="/properties" className="btn btn-outline-secondary d-flex align-items-center">
              <Building size={18} className="me-2" />
              Manage Properties
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
