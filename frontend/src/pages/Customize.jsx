import { useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MdUploadFile } from "react-icons/md";
import { IoMdArrowRoundBack } from "react-icons/io";

import Card from "../components/Card";
import { userDataContext } from "../context/UserContext";

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

  const navigate = useNavigate();
  const inputImage = useRef(null);

  const {
    selectedImage,
    setSelectedImage,
    backendImage,
    setBackendImage,
  } = useContext(userDataContext);

  // Only preview image is local
  const [frontImage, setFrontImage] = useState(null);

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (file) {
      const preview = URL.createObjectURL(file);

      setBackendImage(file);
      setFrontImage(preview);
      setSelectedImage(preview);
    }
  };
  const handleNext = () => {

  navigate("/customize2");
};


  return (
    <div className="w-full min-h-screen bg-gradient-to-t from-black to-[#060666] flex flex-col items-center py-10">
      <IoMdArrowRoundBack className='absolute top-[30px] left-[30px] text-white w-[25px] h-[25px]'
            onClick={() => navigate("/")}
            />
      <h1 className="text-white text-4xl font-bold text-center mb-10">
        Select your
        <br />
        <span className="text-blue-400">Assistant Image</span>
      </h1>

      <div className="w-[90%] max-w-6xl flex flex-wrap justify-center gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => {
              setSelectedImage(card.image);
              setBackendImage(null);
            }}
            className={`rounded-2xl cursor-pointer transition-all duration-300 ${
              selectedImage === card.image
                ? "border-4 border-blue-500 scale-105 shadow-[0_0_25px_rgba(59,130,246,0.8)]"
                : "border-4 border-transparent"
            }`}
          >
            <Card image={card.image} title={card.title} />
          </div>
        ))}

        <div
          onClick={() => inputImage.current.click()}
          className={`w-[180px] h-[250px] rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 bg-[#060666] hover:scale-105 ${
            selectedImage === frontImage
              ? "border-4 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.8)]"
              : "border-2 border-blue-500"
          }`}
        >
          {frontImage ? (
            <img
              src={frontImage}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center">
              <MdUploadFile className="text-white text-6xl" />
              <p className="text-white mt-3 text-sm">Upload Image</p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            hidden
            ref={inputImage}
            onChange={handleImage}
          />
        </div>
      </div>

      {selectedImage && (
        <button
          onClick={handleNext}
          className="mt-12 px-12 py-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white text-lg font-semibold transition-all duration-300 hover:scale-105"
        >
          Next
        </button>
      )}
    </div>
  );
}

export default Customize;