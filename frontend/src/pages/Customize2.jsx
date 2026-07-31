import React, { useState ,useContext} from 'react'
import { userDataContext } from "../context/UserContext";

function Customize2() {
    const {userData}=useContext(userDataContext)
    const [assistantName,setAssistantName]=useState(userData?.assistantName||"Lucy")
  return (
    <div className="w-full min-h-screen bg-gradient-to-t from-black to-[#060666] flex flex-col items-center py-10">
        <h1 className="text-white text-4xl font-bold text-center mb-10">
        Enter your
        <br />
        <span className="text-blue-400">Assistant Name</span>
      </h1>
      <input
      type='text'
        value={assistantName}
        className="w-full max-w-[600px] px-5 py-4 rounded-full outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 text-lg"
        onChange={(e) => setAssistantName(e.target.value)}
        placeholder="Enter your Assistant Name"
        />
        {assistantName && <button
          
          className="
            mt-12
            px-12
            py-3
            bg-blue-500
            hover:bg-blue-600
            rounded-full
            text-white
            text-lg
            font-semibold
            transition-all
            duration-300
            hover:scale-105
          "
        >
          Finally Create Your Assistant
        </button>
}
    </div>
  )
}

export default Customize2