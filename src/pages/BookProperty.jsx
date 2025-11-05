import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import Swal from "sweetalert2";

export default function BookProperty() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoader();
    const [property, setProperty] = useState(null);
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");

    useEffect(() => {
        fetchProperty();
    }, []);

    const fetchProperty = async () => {
        showLoader("Loading property details...");
        try {
            const { data, error } = await supabase
                .from("properties")
                .select(`
          id, title, description, location, price, property_type,
          property_images (image_url),
          profiles (first_name, last_name, email)
        `)
                .eq("id", id)
                .single();
            if (error) throw error;
            setProperty(data);
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();

        if (!checkIn || !checkOut) {
            Swal.fire("Error", "Please select both check-in and check-out dates.", "error");
            return;
        }

        showLoader("Processing your booking...");

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                Swal.fire("Error", "You must be logged in to book a property.", "error");
                return;
            }

            const { error } = await supabase.from("bookings").insert([
                {
                    user_id: user.id,
                    owner_id: property.profiles?.id || property.owner_id,
                    property_id: property.id,
                    check_in: checkIn,
                    check_out: checkOut,
                    status: "pending",
                },
            ]);

            if (error) throw error;

            Swal.fire(
                "Booking Requested!",
                "Your booking has been submitted and is pending confirmation.",
                "success"
            );
            navigate("/my-bookings");
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };

    if (!property) return null;

    const mainImage =
        property.property_images?.[0]?.image_url || "/placeholder.jpg";

    return (
        <div className="container mt-4">
            <div className="card shadow-lg border-0">
                <div className="row g-0">
                    {/* 🏠 Property Details */}
                    <div className="col-md-7">
                        <img
                            src={mainImage}
                            alt={property.title}
                            className="img-fluid rounded-start"
                            style={{ width: "100%", height: "380px", objectFit: "cover" }}
                        />
                        <div className="p-4">
                            <h3 className="fw-bold text-primary mb-2">{property.title}</h3>
                            <p className="text-muted mb-1">
                                <i className="bi bi-geo-alt"></i> {property.location}
                            </p>
                            <p className="text-secondary mb-2">
                                <strong>Type:</strong> {property.property_type}
                            </p>
                            <p className="mb-2">
                                <strong>Owner:</strong>{" "}
                                {property.profiles
                                    ? `${property.profiles.first_name} ${property.profiles.last_name}`
                                    : "Unknown"}
                            </p>
                            <h5 className="text-success fw-bold mt-3">
                                ₹{property.price} / night
                            </h5>
                            <p className="mt-3 text-muted" style={{ lineHeight: 1.6 }}>
                                {property.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* 📅 Booking Form */}
                    <div className="col-md-5 bg-light p-4 d-flex flex-column justify-content-center">
                        <h4 className="fw-bold text-center mb-3">Book This Property</h4>
                        <form onSubmit={handleBooking}>
                            <div className="mb-3">
                                <label className="form-label">Check-in Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={checkIn}
                                    onChange={(e) => setCheckIn(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Check-out Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={checkOut}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100 mt-2">
                                Confirm Booking
                            </button>
                        </form>

                        <button
                            className="btn btn-outline-secondary w-100 mt-3"
                            onClick={() => navigate("/properties")}
                        >
                            ← Back to Properties
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
