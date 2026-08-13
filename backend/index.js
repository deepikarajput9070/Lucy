import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDb from "./config/db.js";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin:
      "https://lucy-i4jj.onrender.com",

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

app.use(
  cookieParser()
);

app.use(
  "/api/auth",
  authRouter
);

app.use(
  "/api/user",
  userRouter
);
const port =
  process.env.PORT || 8000;

app.listen(
  port,
  async () => {
    await connectDb();

    console.log(
      `Server running on port ${port}`
    );
  }
);
