import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import { useNavigate } from "react-router-dom";

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
  });

  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");

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
    // 🔐 Get current user
    debugger
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw new Error("User not authenticated");
    const userId = userData.user.id;
    const userEmail = userData.user.email;

    // 🧩 Check if profile exists
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle(); // ✅ safer than .single()

    if (!profile) {
      // 🆕 Create profile if missing
      const { error: insertProfileError } = await supabase
        .from("profiles")
        .insert([{ id: userId, email: userEmail, role: "user" }]);

      if (insertProfileError) throw insertProfileError;
      profile = { id: userId };
    }

    // 🏠 Insert property
    const { data: inserted, error: insertError } = await supabase
      .from("properties")
      .insert([
        {
          ...formData,
          owner_id: profile.id,
        },
      ])
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
    setMessage("✅ Property added successfully!");
    setTimeout(() => navigate("/properties"), 1500);
  } catch (err) {
    console.error(err);
    setMessage(`❌ ${err.message}`);
    hideLoader();
  }
};

  return (
    <div className="container mt-4">
      <div className="card shadow-lg p-4">
        <h2 className="text-center mb-3 text-primary fw-bold">Add New Property</h2>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Title</label>
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
              <label className="form-label">Property Type</label>
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
              <label className="form-label">Description</label>
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
              <label className="form-label">Price</label>
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
              <label className="form-label">Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter location"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Longitude</label>
              <input
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="form-control"
                placeholder="Longitude"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Latitude</label>
              <input
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="form-control"
                placeholder="Latitude"
              />
            </div>

            <div className="col-md-12 mb-3">
              <label className="form-label">Upload Images</label>
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

        {message && (
          <div className="alert alert-info text-center mt-3">{message}</div>
        )}
      </div>
    </div>
  );
}
