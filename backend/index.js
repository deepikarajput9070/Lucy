import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDb from "./config/db.js";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://lucy-i4jj.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());


app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Lucy backend is awake",
  });
});


app.use(
  "/api/auth",
  authRouter
);

app.use(
  "/api/user",
  userRouter
);


const port = process.env.PORT || 8000;

app.listen(
  port,
  "0.0.0.0",
  async () => {
    await connectDb();

    console.log(
      `Server running on port ${port}`
    );
  }
);
