import React from 'react';  

//For Font-Awesome emojis
import '@fortawesome/fontawesome-free/css/all.min.css'

//This causes things to run twice for testing purposes
import { StrictMode } from 'react'

//1. Create Root
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/mh1.css'
import './styles/navbar.css'

import App from './App.jsx';

//2. Render a markup to root
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
  // <h1>
  //   Can either render the App directly or some words is fine.
  // </h1>
)
