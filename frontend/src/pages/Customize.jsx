import { useRef, useState } from "react";
import Card from "../components/Card";
import { MdUploadFile } from "react-icons/md";

import img1 from "../assets/img.jpg";
import img2 from "../assets/img1.jpg";
import img3 from "../assets/img2.jpg";
import img4 from "../assets/img3.jpg";
import img5 from "../assets/img4.jpg";
import img6 from "../assets/img5.jpg";

function Customize() {
  const cards = [
    { image: img1, title: "Card 1" },
    { image: img2, title: "Card 2" },
    { image: img3, title: "Card 3" },
    { image: img4, title: "Card 4" },
    { image: img5, title: "Card 5" },
    { image: img6, title: "Card 6" },
  ];

  // Image shown in the UI
  const [frontImage, setFrontImage] = useState(null);

  // Actual image file for backend
  const [backendImage, setBackendImage] = useState(null);

  // File input reference
  const inputImage = useRef(null);

  // Handle image upload
  const handleImage = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Store actual file
      setBackendImage(file);

      // Create preview
      setFrontImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-t from-black to-[#060666] flex flex-col items-center py-10">

      {/* Heading */}
      <h1 className="text-white text-4xl font-bold text-center mb-10">
        Select your
        <br />
        <span className="text-blue-400">
          Assistant Image
        </span>
      </h1>

      {/* Cards Container */}
      <div className="w-[90%] max-w-6xl flex flex-wrap justify-center gap-6">

        {/* Default Image Cards */}
        {cards.map((card, index) => (
          <Card
            key={index}
            image={card.image}
            title={card.title}
          />
        ))}

        {/* Upload Card */}
        <div
          onClick={() => inputImage.current.click()}
          className="
            w-[180px]
            h-[250px]
            bg-[#060666]
            border-2
            border-blue-500
            rounded-2xl
            flex
            items-center
            justify-center
            cursor-pointer
            overflow-hidden
            transition-all
            duration-300
            hover:border-white
            hover:shadow-[0_0_30px_rgba(59,130,246,0.9)]
            hover:scale-105
          "
        >

          {/* Show uploaded image */}
          {frontImage ? (
            <img
              src={frontImage}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center">
              <MdUploadFile className="text-white text-6xl" />

              <p className="text-white mt-3 text-sm">
                Upload Image
              </p>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            ref={inputImage}
            hidden
            onChange={handleImage}
          />

        </div>

      </div>

      {/* Next Button */}
      <button
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
        Next
      </button>

    </div>
  );
}

export default Customize;