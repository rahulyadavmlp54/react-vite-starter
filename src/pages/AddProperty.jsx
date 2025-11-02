import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useLoader } from '../context/LoaderContext'

export default function AddProperty() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    latitude: '',
    longitude: '',
    property_type: 'Apartment'
  })
  const [images, setImages] = useState([])
  const [message, setMessage] = useState('')
  const { showLoader, hideLoader } = useLoader()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageUpload = (e) => {
    setImages([...e.target.files])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    showLoader('Adding property...')

    try {
      // Get logged-in user ID (for owner_id)
      debugger
      const { data: userData } = await supabase.auth.getUser()
      const ownerId = userData?.user?.id
      if (!ownerId) throw new Error('User not authenticated')

      // ✅ Step 1: Insert the property
      const { data: inserted, error: insertError } = await supabase
        .from('properties')
        .insert([
          {
            ...formData,
            owner_id: ownerId
          }
        ])
        .select('id')
        .single()

      if (insertError) throw insertError
      const propertyId = inserted.id

      // ✅ Step 2: Upload each image and store URLs
      for (const file of images) {
        const fileName = `${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName)

        await supabase.from('property_images').insert([
          {
            property_id: propertyId,
            image_url: publicUrlData.publicUrl
          }
        ])
      }

      hideLoader()
      setMessage('✅ Property added successfully!')
      setTimeout(() => navigate('/properties'), 1500)
    } catch (err) {
      console.error(err)
      setMessage(`❌ Error: ${err.message}`)
      hideLoader()
    }
  }

  return (
    <div className="container py-4">
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-4">
          <h2 className="fw-bold mb-4 text-primary text-center">🏠 Add New Property</h2>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Property Type</label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option>Apartment</option>
                  <option>Villa</option>
                  <option>House</option>
                  <option>Plot</option>
                  <option>Commercial</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Upload Images</label>
                <input
                  type="file"
                  multiple
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="text-center mt-4">
              <button type="submit" className="btn btn-success px-4 py-2">
                Add Property
              </button>
            </div>
          </form>

          {message && <div className="alert alert-info text-center mt-4">{message}</div>}
        </div>
      </div>
    </div>
  )
}
