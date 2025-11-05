import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import Swal from "sweetalert2";

export default function EditProperty() {
  const { id } = useParams();
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
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [message, setMessage] = useState("");

  // 🧠 Fetch property data on load
  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    showLoader("Loading property...");
    const { data, error } = await supabase
      .from("properties")
      .select(`
        id,
        title,
        description,
        price,
        location,
        longitude,
        latitude,
        property_type,
        property_images (id, image_url)
      `)
      .eq("id", id)
      .single();

    hideLoader();

    if (error) {
      console.error(error);
      setMessage("❌ Failed to load property");
      return;
    }

    setFormData({
      title: data.title || "",
      description: data.description || "",
      price: data.price || "",
      location: data.location || "",
      longitude: data.longitude || "",
      latitude: data.latitude || "",
      property_type: data.property_type || "",
    });

    setExistingImages(data.property_images || []);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    showLoader("Updating property...");

    try {
      // 🏗️ Update property details
      const { error: updateError } = await supabase
        .from("properties")
        .update(formData)
        .eq("id", id);

      if (updateError) throw updateError;

      // 🖼️ Upload new images (if any)
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
            property_id: id,
            image_url: publicUrlData.publicUrl,
          },
        ]);
      }

      hideLoader();
      setMessage("✅ Property updated successfully!");
      setTimeout(() => navigate("/properties"), 1500);
    } catch (err) {
      console.error(err);
      hideLoader();
      setMessage(`❌ ${err.message}`);
    }
  };

 const handleDeleteImage = async (imageId) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This image will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  const { error } = await supabase
    .from("property_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    console.error(error);
    Swal.fire("Error", "Failed to delete image!", "error");
  } else {
    setExistingImages(existingImages.filter((img) => img.id !== imageId));
    Swal.fire("Deleted!", "Image has been deleted.", "success");
  }
};

  return (
    <div className="container mt-4">
      <div className="card shadow-lg p-4">
        <h2 className="text-center mb-3 text-primary fw-bold">Edit Property</h2>
        <form onSubmit={handleUpdate}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-control"
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
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Longitude</label>
              <input
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Latitude</label>
              <input
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-12 mb-3">
              <label className="form-label">Existing Images</label>
              <div className="d-flex flex-wrap gap-3">
                {existingImages.length > 0 ? (
                  existingImages.map((img) => (
                    <div key={img.id} className="position-relative">
                      <img
                        src={img.image_url}
                        alt="property"
                        style={{
                          width: "120px",
                          height: "90px",
                          objectFit: "cover",
                          borderRadius: "6px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="btn btn-sm btn-danger position-absolute top-0 end-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No images yet.</p>
                )}
              </div>
            </div>

            <div className="col-md-12 mb-3">
              <label className="form-label">Upload New Images</label>
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
            Update Property
          </button>
        </form>

        {message && (
          <div className="alert alert-info text-center mt-3">{message}</div>
        )}
      </div>
    </div>
  );
}
