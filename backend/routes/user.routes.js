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

// ============================================================
// CURRENT USER
// ============================================================

userRouter.get(
  "/current",
  isAuth,
  getCurrentUser
);

// ============================================================
// UPDATE ASSISTANT
// ============================================================

userRouter.post(
  "/update",
  isAuth,
  upload.single("assistantImage"),
  updateAssistant
);

// ============================================================
// ASK ASSISTANT
// ============================================================

userRouter.post(
  "/asktoassistant",
  isAuth,
  askToAssistant
);

export default userRouter;