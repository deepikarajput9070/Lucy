import React from 'react'
import { Routes, Route } from 'react-router-dom'
import SignIn from './pages/SignIn.jsx'
import Signup from './pages/SignUp.jsx'

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/signin" element={<SignIn />} />
    </Routes>
  )
}

export default App