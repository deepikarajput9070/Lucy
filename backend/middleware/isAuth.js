import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication token not found",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.userId) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

export default isAuth;