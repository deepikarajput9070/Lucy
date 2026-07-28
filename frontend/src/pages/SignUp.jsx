import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { IoEye, IoEyeOff } from "react-icons/io5";
import axios from "axios";
import image from "../assets/peakpx.jpg";
import { userDataContext } from "../context/userContext";

function Signup() {
  const { serverUrl } = useContext(userDataContext);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        {
          name: name.trim(),
          email: email.trim(),
          password,
        },
        {
          withCredentials: true,
        }
      );

      console.log(result.data);

      setName("");
      setEmail("");
      setPassword("");

      navigate("/signin");
    } catch (err) {
      console.log(err.response?.data || err.message);

      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full h-screen bg-cover bg-center flex justify-center items-center"
      style={{ backgroundImage: `url(${image})` }}
    >
      <form
        onSubmit={handleSignUp}
        className="bg-[#0000003d] w-[90%] max-w-[600px] h-[700px] backdrop-blur-md shadow-lg shadow-black rounded-lg flex flex-col justify-center items-center gap-5 px-6"
      >
        <h1 className="text-white text-3xl font-semibold mb-8">
          Register to{" "}
          <span className="text-blue-400">Virtual Assistant</span>
        </h1>

        <input
          type="text"
          placeholder="Enter your Name"
          className="w-full h-14 border-2 border-white rounded-full bg-transparent outline-none text-white placeholder:text-gray-300 px-5"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Enter your Email"
          className="w-full h-14 border-2 border-white rounded-full bg-transparent outline-none text-white placeholder:text-gray-300 px-5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your Password"
            className="w-full h-14 border-2 border-white rounded-full bg-transparent outline-none text-white placeholder:text-gray-300 px-5 pr-14"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {showPassword ? (
            <IoEyeOff
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-2xl cursor-pointer"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <IoEye
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-2xl cursor-pointer"
              onClick={() => setShowPassword(true)}
            />
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm font-medium text-center">
            * {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-full text-white text-lg font-semibold transition"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <p className="text-white text-lg">
          Already have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </span>
        </p>
      </form>
    </div>
  );
}

export default Signup;
