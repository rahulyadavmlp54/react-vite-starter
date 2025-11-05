import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "datatables.net-bs5";
import { useLoader } from "../context/LoaderContext";

export default function PropertiesList() {
  const [properties, setProperties] = useState([]);
  const [role, setRole] = useState("user");
  const [userId, setUserId] = useState(null);
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    fetchUserRoleAndProperties();
  }, []);

  // ✅ Fetch user role + properties
  const fetchUserRoleAndProperties = async () => {
    showLoader("Loading properties...");
    try {
      // 🔹 Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 🔹 Fetch user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role) setRole(profile.role);

      // 🔹 Fetch all properties
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          id,
          title,
          price,
          location,
          property_type,
          created_at,
          owner_id,
          profiles (first_name,last_name,email),
          property_images (image_url)
          `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data);

      // 🔹 Reinitialize DataTable safely
      setTimeout(() => {
        if ($.fn.dataTable.isDataTable(tableRef.current)) {
          $(tableRef.current).DataTable().destroy();
        }
        $(tableRef.current).DataTable();
      }, 100);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load properties.", "error");
    } finally {
      hideLoader();
    }
  };

  // ✅ Handle Delete
  const handleDelete = async (propertyId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This property will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;
    showLoader("Deleting property...");

    try {
      // Delete property images
      const { data: images } = await supabase
        .from("property_images")
        .select("image_url")
        .eq("property_id", propertyId);

      if (images?.length > 0) {
        const paths = images.map((img) => img.image_url.split("/").pop());
        await supabase.storage.from("property-images").remove(paths);
        await supabase.from("property_images").delete().eq("property_id", propertyId);
      }

      // Delete property
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);
      if (error) throw error;

      Swal.fire("Deleted!", "Property has been removed.", "success");
      fetchUserRoleAndProperties();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      hideLoader();
    }
  };

  // ✅ Handle Edit navigation
  const handleEdit = (id) => navigate(`/properties/edit/${id}`);

  // ✅ Handle Book navigation
  const handleBook = (id) => navigate(`/properties/book/${id}`);

  // ✅ Filter properties for user (if not admin)
  const visibleProperties =
    role === "admin" ? properties : properties.filter((p) => p.owner_id !== userId);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold text-primary">
          {role === "admin" ? "🏘️ All Properties" : "🏡 Available Properties"}
        </h2>

        {role === "admin" && (
          <Link to="/properties/add" className="btn btn-success">
            ➕ Add Property
          </Link>
        )}
      </div>

      <div className="card shadow-sm p-3">
        <table
          className="table table-bordered table-striped"
          ref={tableRef}
          style={{ width: "100%" }}
        >
          <thead className="table-dark">
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Type</th>
              <th>Price</th>
              <th>Location</th>
              <th>Owner</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProperties.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.property_images?.[0]?.image_url ? (
                    <img
                      src={p.property_images[0].image_url}
                      alt="property"
                      style={{
                        width: "80px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td>{p.title}</td>
                <td>{p.property_type}</td>
                <td>₹{p.price}</td>
                <td>{p.location}</td>
                <td>
                  {p.profiles
                    ? `${p.profiles.first_name || ""} ${p.profiles.last_name || ""}`
                    : "Unknown"}
                </td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td>
                  {role === "admin" ? (
                    <>
                      <button
                        onClick={() => handleEdit(p.id)}
                        className="btn btn-sm btn-primary me-2"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="btn btn-sm btn-danger"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate(`/properties/${p.id}`)}
                        className="btn btn-sm btn-outline-primary me-2"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleBook(p.id)}
                        className="btn btn-sm btn-success"
                      >
                        🏠 Book Now
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
