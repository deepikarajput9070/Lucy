import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const userDataContext = createContext();

function UserContextProvider({ children }) {
  // Backend URL
  const serverUrl = "https://lucy-backend-qirz.onrender.com";

  // States
  const [userData, setUserData] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch current logged-in user
  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/user/current`,
        {
          withCredentials: true,
        }
      );

      setUserData(result.data);
      console.log("Current User:", result.data);
    } catch (error) {
      console.log(
        "Current User Error:",
        error.response?.data || error.message
      );
      setUserData(null);
    }
  };

  const getGroqResponse =async(command)=>{
    try {const result=axios.post('${serverUrl}/api/user/asktoassistant',
      {command},{withCredentials:true})
      return result.data
      
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    handleCurrentUser();
  }, []);

  const value = {
    serverUrl,
    userData,
    setUserData,
    selectedImage,
    setSelectedImage,
    backendImage,
    setBackendImage,
    getGroqResponse,
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContextProvider;
