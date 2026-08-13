import React, { useState, useContext } from "react";
import axios from "axios";
import { userDataContext } from "../context/UserContext";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";

function Customize2() {
  const {
    userData,
    backendImage,
    selectedImage,
    serverUrl,
    setUserData,
  } = useContext(userDataContext);

  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/customize");
    }
  };

  const [assistantName, setAssistantName] = useState(
    userData?.assistantName || "Lucy"
  );

  const [loading, setLoading] = useState(false);

  const handleUpdateAssistant = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("assistantName", assistantName);

      if (backendImage) {
        formData.append("assistantImage", backendImage);
      } else {
        formData.append("imageUrl", selectedImage);
      }

      const result = await axios.post(
        `${serverUrl}/api/user/update`,
        formData,
        {
          withCredentials: true,
        }
      );

      console.log("Response:", result.data);

      // If backend returns { success:true, user:{} }
      if (result.data.user) {
        setUserData(result.data.user);
      } else {
        // If backend returns the user object directly
        setUserData(result.data);
      }

      navigate("/", { replace: true });

    } catch (err) {
      console.error(
        "Update Error:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-t from-black to-[#060666] flex flex-col justify-center items-center px-5 relative">

      <IoMdArrowRoundBack
        className="absolute top-8 left-8 text-white text-3xl cursor-pointer"
        onClick={handleBack}
      />

      <h1 className="text-white text-4xl font-bold text-center mb-10">
        Enter your
        <br />
        <span className="text-blue-400">
          Assistant Name
        </span>
      </h1>

      <input
        type="text"
        value={assistantName}
        onChange={(e) => setAssistantName(e.target.value)}
        placeholder="Enter your Assistant Name"
        className="w-full max-w-[600px] px-5 py-4 rounded-full outline-none border-2 border-white bg-transparent text-white placeholder:text-gray-300 text-lg"
      />

      {assistantName && (
        <button
          disabled={loading}
          onClick={handleUpdateAssistant}
          className="mt-10 px-12 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-full text-white text-lg font-semibold transition-all duration-300"
        >
          {loading
            ? "Creating..."
            : "Finally Create Your Assistant"}
        </button>
      )}
    </div>
  );
}

export default Customize2;