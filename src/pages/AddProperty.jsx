import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function AddProperty() {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    longitude: "",
    latitude: "",
    property_type: "",
    status: "available",
    owner_id: "",
  });

  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch user role and owners (for admin)
  useEffect(() => {
    const fetchRoleAndOwners = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) setRole(profile.role);

      if (profile?.role === "admin") {
        const { data: ownersData } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .eq("role", "owner");

        setOwners(ownersData || []);
      }

      setLoading(false);
    };

    fetchRoleAndOwners();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    showLoader("Adding property...");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error("User not authenticated");
      const userId = userData.user.id;
      const userEmail = userData.user.email;

      let { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) {
        await supabase.from("profiles").insert([{ id: userId, email: userEmail, role: "user" }]);
        profile = { id: userId, role: "user" };
      }

      // 🏠 Determine owner_id
      const ownerId =
        role === "admin"
          ? formData.owner_id
          : profile.id;

      if (!ownerId) throw new Error("No owner assigned. Cannot add property.");

      // 🏠 Insert property
      const { data: inserted, error: insertError } = await supabase
        .from("properties")
        .insert([{ ...formData, owner_id: ownerId }])
        .select("id")
        .single();

      if (insertError) throw insertError;
      const propertyId = inserted.id;

      // 🖼️ Upload images
      for (const file of images) {
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);

        await supabase.from("property_images").insert([
          {
            property_id: propertyId,
            image_url: publicUrlData.publicUrl,
          },
        ]);
      }

      hideLoader();
      Swal.fire("Success", "Property added successfully!", "success");
      navigate("/properties");
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
      hideLoader();
    }
  };

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading...</p>
      </div>
    );
  }

  const noOwnersExist = role === "admin" && owners.length === 0;

  return (
    <div className="container mt-4">
      <div className="card shadow-lg p-4 border-0">
        <h2 className="text-center mb-3 text-primary fw-bold">
          {role === "admin" ? "Add New Property (Admin)" : "Add My Property"}
        </h2>

        {noOwnersExist ? (
          <div className="alert alert-warning text-center p-4 fs-5 fw-semibold">
            ⚠️ No owners exist in the system. Please create at least one owner before adding properties.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Owner field visible only to Admin */}
            {role === "admin" && owners.length > 0 && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Select Owner</label>
                <select
                  name="owner_id"
                  className="form-select"
                  value={formData.owner_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Owner --</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.first_name
                        ? `${o.first_name} ${o.last_name || ""}`
                        : o.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter property title"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Property Type</label>
                <input
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. Apartment, Villa"
                  required
                />
              </div>

              <div className="col-md-12 mb-3">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                  placeholder="Describe the property"
                ></textarea>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter price"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Location</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter location"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Longitude</label>
                <input
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Longitude"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Latitude</label>
                <input
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Latitude"
                />
              </div>

              <div className="col-md-12 mb-3">
                <label className="form-label fw-semibold">Upload Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="form-control"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Add Property
            </button>
          </form>
        )}

        {message && (
          <div className="alert alert-info text-center mt-3">{message}</div>
        )}
      </div>
    </div>
  );
}
