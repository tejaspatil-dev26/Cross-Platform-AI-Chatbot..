import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // THIS IS THE MAGIC LINK THAT INJECTS YOUR STYLES!

const WIDGET_ID = 'ai-chatbot-widget-container'

if (!document.getElementById(WIDGET_ID)) {
  const widgetRoot = document.createElement('div')
  widgetRoot.id = WIDGET_ID
  document.body.appendChild(widgetRoot)

  ReactDOM.createRoot(widgetRoot).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}