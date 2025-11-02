import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import $ from 'jquery'
import 'datatables.net-bs5'
import 'datatables.net-responsive-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'
import 'datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css'
import { useNavigate } from 'react-router-dom'

export default function PropertiesList() {
  const [properties, setProperties] = useState([])
  const tableRef = useRef(null)
  const dataTable = useRef(null)
  const navigate = useNavigate()

  // ✅ Fetch properties with owner name + image
  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select(`id, title, price, location, property_type, created_at, owner_id, property_images (image_url), profiles (full_name) `).order('created_at', { ascending: false })

    if (error) console.error(error)
    else setProperties(data)
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  // Initialize DataTable after data loads
  useEffect(() => {
    if (properties.length > 0) {
      if (dataTable.current) dataTable.current.destroy()
      dataTable.current = $(tableRef.current).DataTable()
    }
  }, [properties])

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold text-primary">🏘️ Properties List</h2>
        <button
          className="btn btn-success"
          onClick={() => navigate('/properties/add')}
        >
          + Add Property
        </button>
      </div>

      <div className="table-responsive">
        <table ref={tableRef} className="table table-striped align-middle">
          <thead className="table-dark">
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Owner</th>
              <th>Type</th>
              <th>Price</th>
              <th>Location</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.property_images?.[0]?.image_url ? (
                    <img
                      src={p.property_images[0].image_url}
                      alt={p.title}
                      width="70"
                      height="50"
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : (
                    <span className="text-muted">No image</span>
                  )}
                </td>
                <td>{p.title}</td>
                <td>{p.profiles?.full_name || '—'}</td>
                <td>{p.property_type}</td>
                <td>₹{p.price}</td>
                <td>{p.location}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}