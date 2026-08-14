import express from "express";

import {
  Login,
  Logout,
  signUp,
} from "../controllers/user.controller.js";

import {
  askToAssistant,
  getCurrentUser,
  updateAssistant,
} from "../controllers/use.controller.js";

import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth, getCurrentUser);

userRouter.post(
  "/update",
  isAuth,
  upload.single("assistantImage"),
  updateAssistant
);

userRouter.post("/logout", Logout);

userRouter.post("/signin", Login);

userRouter.post("/signup", signUp);

userRouter.post("/asktoassistant", isAuth, askToAssistant);

export default userRouter;
