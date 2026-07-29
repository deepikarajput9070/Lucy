import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Home from "./pages/Home.jsx";
import Customize from "./pages/Customize.jsx";

import { userDataContext } from "./context/UserContext.jsx";

function App() {
  const { userData, setUserData } = useContext(userDataContext);

  return (
    <Routes>
      <Route
        path="/"
        element={
          userData?.assistantImage && userData?.assistantName
            ? <Home />
            : <Navigate to="/customize" />
        }
      />

      <Route
        path="/signup"
        element={<SignUp />}
      />

      <Route
        path="/signin"
        element={<SignIn />}
      />

      <Route
        path="/customize"
        element={<Customize />}
      />
    </Routes>
  );
}

export default App;
