import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <-- CRITICAL IMPORT
import App from './app/App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}> {/* <-- CRITICAL WRAPPER UPDATE */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)