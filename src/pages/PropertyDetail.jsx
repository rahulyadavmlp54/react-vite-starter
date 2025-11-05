import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import Swal from "sweetalert2";

export default function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoader();
    const [property, setProperty] = useState(null);

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

    if (!property) return null;

    const images = property.property_images || [];
    const mainImage = images[0]?.image_url || "/placeholder.jpg";

    return (
        <div className="container mt-4">
            <div className="card shadow-lg border-0">
                <div className="row g-0">
                    {/* 🖼️ Left Section: Property Image Gallery */}
                    <div className="col-md-7">
                        <img
                            src={mainImage}
                            alt={property.title}
                            className="img-fluid rounded-start"
                            style={{ width: "100%", height: "400px", objectFit: "cover" }}
                        />
                        {images.length > 1 && (
                            <div className="d-flex flex-wrap mt-2 px-3 pb-3 gap-2">
                                {images.slice(1).map((img, index) => (
                                    <img
                                        key={index}
                                        src={img.image_url}
                                        alt={`Property ${index + 1}`}
                                        style={{
                                            width: "90px",
                                            height: "70px",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                        }}
                                        onClick={() =>
                                            window.scrollTo({ top: 0, behavior: "smooth" })
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 🏡 Right Section: Property Info */}
                    <div className="col-md-5 p-4 bg-light d-flex flex-column justify-content-between">
                        <div>
                            <h3 className="fw-bold text-primary">{property.title}</h3>
                            <p className="text-muted mb-2">
                                <i className="bi bi-geo-alt"></i> {property.location}
                            </p>
                            <p className="text-secondary mb-1">
                                <strong>Type:</strong> {property.property_type}
                            </p>
                            <p className="mb-1">
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

                        <div className="mt-4">
                            <button
                                onClick={() => navigate(`/properties/book/${property.id}`)}
                                className="btn btn-primary w-100"
                            >
                                📅 Book Now
                            </button>

                            <button
                                onClick={() => navigate("/properties")}
                                className="btn btn-outline-secondary w-100 mt-2"
                            >
                                ← Back to Properties
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
