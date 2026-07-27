import jwt from "jsonwebtoken";

const genToken = async (id) => {
  try {
    const token = jwt.sign(
      { userId: id },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );

    return token;
  } catch (error) {
    throw new Error("Error generating token");
  }
};

export default genToken;
