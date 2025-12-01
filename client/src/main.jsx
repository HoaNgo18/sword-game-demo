import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Tạo file này trống hoặc basic css

ReactDOM.createRoot(document.getElementById('root')).render(
  // Tắt StrictMode khi dev game với Phaser để tránh init 2 lần gây lỗi
  <App />
)