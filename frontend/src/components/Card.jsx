import React from "react";

function Card({ image, title }) {
  return (
    <div
      className="
        w-[180px]
        rounded-2xl
        overflow-hidden
        border-2
        border-blue-500
        bg-[#040499]
        cursor-pointer
        transition-all
        duration-300
        hover:border-cyan-400
        hover:shadow-2xl
        hover:shadow-cyan-500/60
        hover:scale-105
      "
    >
      <img
        src={image}
        alt={title}
        className="w-full h-[250px] object-cover"
      />
    </div>
  );
}

export default Card;