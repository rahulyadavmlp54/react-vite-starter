import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import Swal from "sweetalert2";

export default function MyBookings() {
    const { showLoader, hideLoader } = useLoader();
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        fetchMyBookings();
    }, []);

    const fetchMyBookings = async () => {
        showLoader("Loading your bookings...");
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("bookings")
                .select(
                    `
          id, check_in, check_out, status, created_at,
          properties(title, location, price)
        `
                )
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setBookings(data);
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };

    const handleCancel = async (id) => {
        const confirm = await Swal.fire({
            title: "Cancel this booking?",
            text: "You will lose this reservation.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, cancel it",
        });
        if (!confirm.isConfirmed) return;

        showLoader("Cancelling booking...");
        try {
            const { error } = await supabase
                .from("bookings")
                .update({ status: "cancelled" })
                .eq("id", id);

            if (error) throw error;
            Swal.fire("Cancelled!", "Your booking has been cancelled.", "success");
            fetchMyBookings();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="fw-bold mb-4 text-primary">🧳 My Bookings</h2>

            {bookings.length === 0 ? (
                <p className="text-muted">You have no bookings yet.</p>
            ) : (
                <div className="table-responsive shadow-sm">
                    <table className="table table-bordered align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>Property</th>
                                <th>Location</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b.id}>
                                    <td>{b.properties?.title}</td>
                                    <td>{b.properties?.location}</td>
                                    <td>{new Date(b.check_in).toLocaleDateString()}</td>
                                    <td>{new Date(b.check_out).toLocaleDateString()}</td>
                                    <td>₹{b.properties?.price}</td>
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
                                    <td>
                                        {b.status === "confirmed" && (
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleCancel(b.id)}
                                            >
                                                ❌ Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
