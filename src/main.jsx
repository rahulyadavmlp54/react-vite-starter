import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { LoaderProvider } from './context/LoaderContext'

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <LoaderProvider>
      <App />
    </LoaderProvider>
  </React.StrictMode>
)
