import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const userDataContext = createContext();

function UserContextProvider({ children }) {
  const serverUrl = "http://localhost:8000";

  const [userData, setUserData] = useState(null);
  

  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/user/current`,
        { withCredentials: true }
      );

      setUserData(result.data);
      console.log(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleCurrentUser();
  }, []);

  const value={userData, setUserData,serverUrl}
  return (
    <userDataContext.Provider
      value={value}
    >
      {children}
    </userDataContext.Provider>
  );
}

export default UserContextProvider;
