import React from 'react'
import { useContext } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useEffect } from 'react'

function Home() {
  const navigate=useNavigate() ;
  const { userData, serverUrl, setUserData } = useContext(userDataContext);
  const handleLogout= async ()=>{
    try{
      const res=await axios.get(`${serverUrl}/api/auth/logout`,{withCredentials:true})
      navigate("/signup")
      setUserData(null)
    }catch(err){
      console.log(err)
    }
  }

useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.log("Speech Recognition is not supported.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript =
      event.results[event.results.length - 1][0].transcript;

    console.log("User:", transcript);
  };

  recognition.onend = () => {
    recognition.start(); 
  };

  recognition.start();

  return () => {
    recognition.onend = null;
    recognition.stop();
  };
}, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-t from-black to-[#060666] flex flex-col items-center justify-center cursor-pointer gap-[15px]">
      <button
        onClick={handleLogout}
        className="absolute top-8 right-8 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
        >
         Log Out
        </button>

        <button
          onClick={() => navigate("/customize")}
          className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
          >
          Customize Your Assistant
        </button>


      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg">
        <img src={userData?.assistantImage} alt="Assistant" className="w-full h-full object-cover" />
      </div>
      <h1 className=" text-white  text-xl font-bold">
          I'm {userData?.assistantName}
        </h1>
    </div>
  )
}

export default Home