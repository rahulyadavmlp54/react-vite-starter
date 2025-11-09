import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import Swal from "sweetalert2";

/**
 * MyBookings (with Razorpay)
 * - Replace process.env.REACT_APP_RAZORPAY_KEY with your Razorpay Key ID
 * - For production: create Razorpay order on server and verify signatures server-side
 */

export default function MyBookings() {
    const { showLoader, hideLoader } = useLoader();
    const [bookings, setBookings] = useState([]);
    const [role, setRole] = useState("user");

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

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            const userRole = profile?.role || "user";
            setRole(userRole);

            let query = supabase.from("bookings").select(
                `
        id,
        check_in,
        check_out,
        status,
        created_at,
        user_id,
        properties (
          id,
          title,
          location,
          price,
          property_type,
          property_images (image_url),
          owner_id
        )
        `
            );

            if (userRole === "owner") query = query.eq("properties.owner_id", user.id);
            else query = query.eq("user_id", user.id);

            const { data, error } = await query.order("created_at", { ascending: false });
            if (error) throw error;
            setBookings(data || []);
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };

    // Loads Razorpay SDK (if not already loaded)
    const loadRazorpayScript = () =>
        new Promise((resolve, reject) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
            document.body.appendChild(script);
        });

    // Handle payment with Razorpay
    const handlePayment = async (booking) => {
        // current price
        const price = Number(booking.properties?.price || 0);
        if (!price || price <= 0) {
            Swal.fire("Invalid amount", "Property price is invalid.", "error");
            return;
        }

        const amountInPaise = Math.round(price * 100); // Razorpay uses smallest currency unit

        // Show confirm modal before loading SDK
        const confirm = await Swal.fire({
            title: "Proceed to Payment?",
            html: `You will pay <strong>₹${price}</strong> for <em>${booking.properties?.title}</em>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "💳 Pay Now",
        });
        if (!confirm.isConfirmed) return;

        showLoader("Preparing payment...");

        try {
            // 1) Load Razorpay SDK
            await loadRazorpayScript();

            // NOTE: For production you should create a Razorpay order on the server,
            // return { id: order_id, amount, currency }, then pass order_id below.
            // This example proceeds without server order creation for quick testing.

            // 2) Optionally create a local payment record (status: pending)
            const { data: paymentRow, error: paymentInsertErr } = await supabase
                .from("payments")
                .insert([
                    {
                        booking_id: booking.id,
                        amount: price,
                        payment_status: "pending",
                        payment_method: "razorpay",
                        created_at: new Date(),
                    },
                ])
                .select("id")
                .single();

            if (paymentInsertErr) {
                // warn but continue — we can still open Razorpay
                console.warn("Failed to create local payment record:", paymentInsertErr);
            }

            // 3) Open Razorpay checkout
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_replace_with_key", // <-- replace with your key or env var
                amount: amountInPaise,
                currency: "INR",
                name: "RentEase",
                description: `Payment for booking #${booking.id}`,
                image: "", // optional logo URL
                handler: async function (response) {
                    // response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature
                    showLoader("Verifying payment...");

                    try {
                        // 4) Update payments row (if exists) and mark booking confirmed
                        // Ideally verify signature on server; here we mark confirmed directly
                        const updates = [];

                        // update payment row (if we created one)
                        if (paymentRow?.id) {
                            updates.push(
                                supabase
                                    .from("payments")
                                    .update({
                                        payment_status: "success",
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_order_id: response.razorpay_order_id || null,
                                        razorpay_signature: response.razorpay_signature || null,
                                    })
                                    .eq("id", paymentRow.id)
                            );
                        } else {
                            // fallback: insert payment record with success
                            updates.push(
                                supabase.from("payments").insert([
                                    {
                                        booking_id: booking.id,
                                        amount: price,
                                        payment_status: "success",
                                        payment_method: "razorpay",
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_order_id: response.razorpay_order_id || null,
                                        razorpay_signature: response.razorpay_signature || null,
                                        created_at: new Date(),
                                    },
                                ])
                            );
                        }

                        // update booking status to confirmed
                        updates.push(
                            supabase.from("bookings").update({ status: "confirmed" }).eq("id", booking.id)
                        );

                        // execute updates in parallel
                        const results = await Promise.all(updates);
                        const failed = results.find((r) => r?.error);
                        if (failed) throw failed.error || new Error("Failed to record payment");

                        hideLoader();
                        Swal.fire("Payment successful!", "Booking confirmed 🎉", "success");
                        fetchMyBookings();
                    } catch (err) {
                        hideLoader();
                        console.error("Post-payment error:", err);
                        Swal.fire(
                            "Verification failed",
                            "Payment succeeded but verification/recording failed. Contact support.",
                            "error"
                        );
                        // optional: mark payment as failed in DB
                    }
                },
                prefill: {
                    name: "", // ideally pull from profile
                    email: "", // ideally pull from profile
                },
                notes: {
                    booking_id: booking.id,
                },
                theme: {
                    color: "#0d6efd",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (resp) {
                console.warn("Razorpay payment failed:", resp);
                Swal.fire("Payment failed", resp.error?.description || "Payment was not completed.", "error");
            });

            hideLoader(); // we loaded SDK and prepared checkout
            rzp.open();
        } catch (err) {
            hideLoader();
            console.error("Payment error:", err);
            Swal.fire("Payment Error", err.message || "Failed to start payment", "error");
        }
    };

    // Cancel booking (same as before)
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
            const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
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
            <h2 className="fw-bold mb-4 text-primary">{role === "owner" ? "🏠 Bookings for My Properties" : "🧳 My Bookings"}</h2>

            {bookings.length === 0 ? (
                <p className="text-muted text-center">No bookings yet.</p>
            ) : (
                <div className="row g-4">
                    {bookings.map((b) => (
                        <div className="col-md-4" key={b.id}>
                            <div className="card shadow-sm border-0 h-100">
                                <img
                                    src={b.properties?.property_images?.[0]?.image_url || "https://via.placeholder.com/400x250?text=No+Image"}
                                    className="card-img-top"
                                    alt={b.properties?.title}
                                    style={{ height: "220px", objectFit: "cover" }}
                                />
                                <div className="card-body">
                                    <h5 className="fw-bold text-primary">{b.properties?.title}</h5>
                                    <p className="text-muted mb-1">📍 {b.properties?.location}</p>
                                    <p className="mb-2">💰 ₹{b.properties?.price}</p>
                                    <p className="small text-secondary mb-1">🗓️ {new Date(b.check_in).toLocaleDateString()} → {new Date(b.check_out).toLocaleDateString()}</p>

                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <span className={`badge bg-${b.status === "confirmed" ? "success" : b.status === "pending" ? "warning" : "secondary"} px-3 py-2`}>
                                            {b.status.toUpperCase()}
                                        </span>

                                        {role === "user" && (
                                            <>
                                                {b.status === "pending" && (
                                                    <button className="btn btn-sm btn-outline-success" onClick={() => handlePayment(b)}>
                                                        💳 Pay Now
                                                    </button>
                                                )}

                                                {b.status === "confirmed" && (
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(b.id)}>
                                                        ❌ Cancel
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
