import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import Swal from "sweetalert2";

export default function OwnerBookings() {
    const { showLoader, hideLoader } = useLoader();
    const [groupedBookings, setGroupedBookings] = useState([]);

    useEffect(() => {
        fetchOwnerBookings();
    }, []);

    const fetchOwnerBookings = async () => {
        showLoader("Loading your property bookings...");

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                hideLoader();
                Swal.fire("Error", "User not authenticated. Please log in again.", "error");
                return;
            }

            // 🧠 Fetch all bookings (not filtering at SQL level to avoid null owner_id)
            const { data, error } = await supabase
                .from("bookings")
                .select(`
          id,
          check_in,
          check_out,
          status,
          created_at,
          user:profiles!bookings_user_id_fkey (
            first_name,
            last_name,
            email
          ),
          property:properties (
            id,
            title,
            location,
            price,
            property_type,
            owner_id,
            property_images (image_url)
          )
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // 🔎 Filter only bookings belonging to properties owned by current user
            const ownerBookings = data?.filter((b) => b.property?.owner_id === user.id) || [];

            // 🗂️ Group bookings by property
            const grouped = Object.values(
                ownerBookings.reduce((acc, b) => {
                    const pid = b.property?.id;
                    if (!pid) return acc; // skip if property is missing
                    if (!acc[pid]) {
                        acc[pid] = { property: b.property, bookings: [] };
                    }
                    acc[pid].bookings.push(b);
                    return acc;
                }, {})
            );

            setGroupedBookings(grouped);
        } catch (err) {
            console.error("Error fetching owner bookings:", err);
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };

    const handleCancelBooking = async (id) => {
        const confirm = await Swal.fire({
            title: "Cancel this booking?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, cancel it",
        });
        if (!confirm.isConfirmed) return;

        showLoader("Cancelling booking...");
        try {
            const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
            if (error) throw error;
            Swal.fire("Cancelled!", "Booking has been cancelled.", "success");
            fetchOwnerBookings();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };

    const handleEditProperty = async (property) => {
        const { value: formValues } = await Swal.fire({
            title: `<h4 class="fw-bold text-primary mb-2">✏️ Edit Property</h4>`,
            html: `
      <div class="text-start" style="max-width: 450px; margin:auto;">
        <label class="form-label fw-semibold">🏠 Title</label>
        <input id="title" type="text" class="form-control rounded-pill mb-3 shadow-sm" 
               placeholder="Enter property title" value="${property.title || ""}" />

        <label class="form-label fw-semibold">📍 Location</label>
        <input id="location" type="text" class="form-control rounded-pill mb-3 shadow-sm" 
               placeholder="Enter location" value="${property.location || ""}" />

        <label class="form-label fw-semibold">💰 Price (₹)</label>
        <input id="price" type="number" class="form-control rounded-pill mb-3 shadow-sm" 
               placeholder="Enter price" value="${property.price || ""}" />

        <label class="form-label fw-semibold">🏡 Property Type</label>
        <input id="property_type" type="text" class="form-control rounded-pill shadow-sm" 
               placeholder="e.g., Apartment, Villa" value="${property.property_type || ""}" />
      </div>
    `,
            width: 600,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: "#0d6efd",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "💾 Save Changes",
            cancelButtonText: "✖️ Cancel",
            customClass: {
                popup: "rounded-4 shadow-lg border-0",
                confirmButton: "rounded-pill px-4 py-2 fw-semibold",
                cancelButton: "rounded-pill px-4 py-2 fw-semibold",
            },
            preConfirm: () => {
                const title = document.getElementById("title").value.trim();
                const location = document.getElementById("location").value.trim();
                const price = document.getElementById("price").value.trim();
                const property_type = document.getElementById("property_type").value.trim();

                if (!title || !location || !price) {
                    Swal.showValidationMessage("Please fill all required fields.");
                    return false;
                }

                return { title, location, price, property_type };
            },
        });

        if (!formValues) return;

        showLoader("Updating property...");
        try {
            const { error } = await supabase
                .from("properties")
                .update({
                    title: formValues.title,
                    location: formValues.location,
                    price: formValues.price,
                    property_type: formValues.property_type,
                })
                .eq("id", property.id);

            if (error) throw error;

            Swal.fire({
                title: "✅ Updated!",
                text: "Property updated successfully.",
                icon: "success",
                confirmButtonColor: "#198754",
                confirmButtonText: "OK",
            });

            fetchOwnerBookings();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };


    return (
        <div className="container mt-4">
            <h2 className="fw-bold mb-4 text-primary">🏠 Bookings for Your Properties</h2>

            {groupedBookings.length === 0 ? (
                <p className="text-muted">No bookings yet for your properties.</p>
            ) : (
                <div className="row g-4">
                    {groupedBookings.map(({ property, bookings }) => (
                        <div className="col-md-6" key={property.id}>
                            <div className="card shadow-sm border-0 h-100">
                                <img
                                    src={
                                        property.property_images?.[0]?.image_url ||
                                        "https://via.placeholder.com/400x250?text=No+Image"
                                    }
                                    className="card-img-top"
                                    style={{
                                        height: "220px",
                                        objectFit: "cover",
                                        borderTopLeftRadius: "8px",
                                        borderTopRightRadius: "8px",
                                    }}
                                    alt={property.title}
                                />
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h5 className="fw-bold text-primary mb-0">{property.title}</h5>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleEditProperty(property)}
                                        >
                                            ✏️ Edit
                                        </button>
                                    </div>
                                    <p className="text-muted mb-1">
                                        📍 {property.location} | 💰 ₹{property.price} | 🏡{" "}
                                        {property.property_type}
                                    </p>
                                    <hr />
                                    <h6 className="fw-semibold text-secondary">Bookings:</h6>

                                    {bookings.length === 0 ? (
                                        <p className="text-muted">No bookings yet for this property.</p>
                                    ) : (
                                        <div className="list-group">
                                            {bookings.map((b) => (
                                                <div
                                                    key={b.id}
                                                    className="list-group-item d-flex justify-content-between align-items-center"
                                                >
                                                    <div>
                                                        <strong>
                                                            {b.user?.first_name || "Guest"} {b.user?.last_name || ""}
                                                        </strong>
                                                        <br />
                                                        <small>{b.user?.email || "No email"}</small>
                                                        <br />
                                                        <small>
                                                            🗓️ {new Date(b.check_in).toLocaleDateString()} →{" "}
                                                            {new Date(b.check_out).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                    <div className="text-end">
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
                                                        {b.status === "confirmed" && (
                                                            <button
                                                                className="btn btn-sm btn-outline-danger mt-2"
                                                                onClick={() => handleCancelBooking(b.id)}
                                                            >
                                                                ❌ Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
