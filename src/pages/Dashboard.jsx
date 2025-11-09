import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Building,
  CalendarCheck,
  ClipboardList,
  Home,
  Users,
  PlusCircle,
} from "lucide-react";

export default function Dashboard() {
  const { showLoader, hideLoader } = useLoader();
  const [role, setRole] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    upcomingBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      showLoader("Loading dashboard...");
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 🔹 Fetch user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const currentRole = profile?.role || "user";
        setRole(currentRole);

        // 🔹 ADMIN DASHBOARD DATA
        if (currentRole === "admin") {
          const [{ count: propertyCount }, { count: bookingCount }, { count: userCount }] =
            await Promise.all([
              supabase.from("properties").select("*", { count: "exact", head: true }),
              supabase.from("bookings").select("*", { count: "exact", head: true }),
              supabase.from("profiles").select("*", { count: "exact", head: true }),
            ]);

          const { data: upcoming } = await supabase
            .from("bookings")
            .select("*, properties(name)")
            .gte("check_in", new Date().toISOString())
            .order("check_in", { ascending: true })
            .limit(3);

          setStats({
            totalUsers: userCount || 0,
            totalProperties: propertyCount || 0,
            totalBookings: bookingCount || 0,
            upcomingBookings: upcoming?.length || 0,
          });
          setRecentBookings(upcoming || []);
        }

        // 🔹 OWNER DASHBOARD DATA
        else if (currentRole === "owner") {
          const [{ count: propertyCount }, { count: bookingCount }] = await Promise.all([
            supabase
              .from("properties")
              .select("*", { count: "exact", head: true })
              .eq("owner_id", user.id),
            supabase
              .from("bookings")
              .select("*", { count: "exact", head: true })
              .eq("owner_id", user.id),
          ]);

          const { data: upcoming } = await supabase
            .from("bookings")
            .select("*, properties(name)")
            .eq("owner_id", user.id)
            .gte("check_in", new Date().toISOString())
            .order("check_in", { ascending: true })
            .limit(3);

          setStats({
            totalUsers: 0,
            totalProperties: propertyCount || 0,
            totalBookings: bookingCount || 0,
            upcomingBookings: upcoming?.length || 0,
          });
          setRecentBookings(upcoming || []);
        }

        // 🔹 USER DASHBOARD DATA
        else {
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
            totalUsers: 0,
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

  // 🔹 Utility: Clickable card component
  const StatCard = ({ icon, title, value, color, onClick }) => (
    <div
      className={`col-md-3 col-sm-6`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div
        className="card text-center border-0 shadow-lg p-4 h-100"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, #1f2937 100%)`,
          color: "white",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
      >
        <div className="mb-2">{icon}</div>
        <h6 className="fw-semibold">{title}</h6>
        <h3 className="fw-bold">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4 px-4">
      <h2 className="fw-bold mb-4 d-flex align-items-center">
        <Home className="me-2" />
        {role === "admin"
          ? "Admin Dashboard"
          : role === "owner"
            ? "Owner Dashboard"
            : "User Dashboard"}
      </h2>

      {/* === STATS SECTION === */}
      <div className="row g-4">
        {role === "admin" && (
          <>
            <StatCard
              icon={<Users size={30} />}
              title="Total Users"
              value={stats.totalUsers}
              color="#2563eb"
              onClick={() => navigate("/users")}
            />
            <StatCard
              icon={<Building size={30} />}
              title="Total Properties"
              value={stats.totalProperties}
              color="#10b981"
              onClick={() => navigate("/properties")}
            />
            <StatCard
              icon={<ClipboardList size={30} />}
              title="Total Bookings"
              value={stats.totalBookings}
              color="#f59e0b"
              onClick={() => navigate("/owner-bookings")}
            />
          </>
        )}

        {role === "owner" && (
          <>
            <StatCard
              icon={<Building size={30} />}
              title="My Properties"
              value={stats.totalProperties}
              color="#10b981"
              onClick={() => navigate("/properties")}
            />
            <StatCard
              icon={<ClipboardList size={30} />}
              title="My Bookings"
              value={stats.totalBookings}
              color="#f59e0b"
              onClick={() => navigate("/owner-bookings")}
            />
          </>
        )}

        {role === "user" && (
          <StatCard
            icon={<CalendarCheck size={30} />}
            title="My Bookings"
            value={stats.totalBookings}
            color="#3b82f6"
            onClick={() => navigate("/my-bookings")}
          />
        )}

        <StatCard
          icon={<CalendarCheck size={30} />}
          title="Upcoming Bookings"
          value={stats.upcomingBookings}
          color="#8b5cf6"
          onClick={() =>
            navigate("/owner-bookings")
          }
        />
      </div>

      {/* === RECENT BOOKINGS === */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Recent / Upcoming Bookings</h4>
          <Link
            to={role === "admin" ? "/owner-bookings" : "/my-bookings"}
            className="btn btn-outline-primary btn-sm"
          >
            View All
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-muted">No upcoming bookings found.</p>
        ) : (
          <div className="table-responsive shadow-sm rounded">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
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

      {/* === QUICK ACTIONS === */}
      {role === "admin" && (
        <div className="mt-5">
          <h4>Quick Actions</h4>
          <div className="d-flex gap-3 mt-3 flex-wrap">
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
